// src/lib/adherence.ts — pure, read-only adherence analytics (backlog #28).
// Counts DUE vs TAKEN dose-slots from intake records over a date range and
// derives per-item streaks plus the days with the most missed doses. No state,
// no db access. STRICTLY DESCRIPTIVE of logged data: no advice, no
// recommendations, no causal/medical claims — the permanent no-advice
// invariant holds (see AGENTS.md Part 2).
//
// A "dose-slot" is one (item, date, time): an active item due on a date
// contributes one slot per scheduled time. A slot is taken iff an IntakeRecord
// exists for that exact (itemId, date, time). Limitations, surfaced in the UI:
// due-days use each item's CURRENT schedule (cadence isn't versioned), days
// before an item was created aren't counted, and archived items are excluded.
import type { IntakeRecord, StackItem } from '../db/db'
import { addDays, toIsoDate } from './dates'
import { isDueOn } from './schedule'

export interface ItemAdherence {
  item: StackItem
  due: number
  taken: number
  pct: number // 0..100, rounded; only items with due > 0 are reported
  streak: number // consecutive most-recent DUE days fully taken, as of `today`
}

// One calendar day on which due doses went untaken.
export interface MissedDay {
  date: string // 'YYYY-MM-DD'
  missed: number // count of due slots not taken that day (across all items)
}

export interface AdherenceReport {
  from: string // first calendar date counted, 'YYYY-MM-DD' (inclusive)
  to: string // last date counted = today (inclusive)
  due: number
  taken: number
  pct: number | null // taken/due as %, or null when nothing was due in range
  items: ItemAdherence[] // due > 0 only, sorted by name
  missedDays: MissedDay[] // days with ≥1 missed dose, most-missed then most-recent first
}

// The item's local start date — days before it existed are never counted.
// createdAt is a UTC ISO instant (nowIso); `new Date()` parses it to that exact
// instant and toIsoDate reads its LOCAL calendar date, so this yields the local
// civil date the item was added regardless of timezone. Do not "simplify" to
// createdAt.slice(0, 10) — that would use the UTC date and be off by a day for
// items added near midnight.
function itemStartDate(item: StackItem): string {
  return toIsoDate(new Date(item.createdAt))
}

function slotKey(itemId: number, date: string, time: string): string {
  return `${itemId}@${date}@${time}`
}

function fullyTaken(
  item: StackItem,
  date: string,
  taken: Set<string>,
): boolean {
  return item.times.every((t) => taken.has(slotKey(item.id, date, t)))
}

// Current streak: walk back from `today` over this item's DUE days only. A due
// day that wasn't fully taken breaks the streak — EXCEPT today itself, which is
// skipped (not broken) when not yet complete, since the day is still in
// progress and an unticked dose shouldn't read as a lapse. Bounded by the
// item's start date so the loop always terminates.
function currentStreak(
  item: StackItem,
  today: string,
  taken: Set<string>,
): number {
  const start = itemStartDate(item)
  let streak = 0
  let date = today
  while (date >= start) {
    if (isDueOn(item, date)) {
      if (fullyTaken(item, date, taken)) streak++
      else if (date !== today) break
      // date === today && not fully taken → in progress: skip, don't break
    }
    date = addDays(date, -1)
  }
  return streak
}

// Builds the adherence report over [from, today]. `rangeStart` is the range's
// first date (graphView.rangeStartDate), or null for 'all' — counting then
// begins at the earliest active-item start. Only ACTIVE items contribute;
// each item is counted only from its own start date forward.
export function buildAdherenceReport(
  activeItems: StackItem[],
  intakes: IntakeRecord[],
  rangeStart: string | null,
  today: string,
): AdherenceReport {
  const taken = new Set(intakes.map((i) => slotKey(i.itemId, i.date, i.time)))
  // Precompute each item's start date once (the day loop checks it per day).
  const startById = new Map(activeItems.map((i) => [i.id, itemStartDate(i)]))

  // 'all' (or a range older than any item) starts at the earliest item.
  const earliestStart = activeItems.length
    ? [...startById.values()].reduce((a, b) => (a < b ? a : b))
    : today
  const from =
    rangeStart && rangeStart > earliestStart ? rangeStart : earliestStart

  const missedByDate = new Map<string, number>()
  const perItem = new Map<number, { due: number; taken: number }>()
  for (const item of activeItems) perItem.set(item.id, { due: 0, taken: 0 })

  let totalDue = 0
  let totalTaken = 0
  let date = from
  while (date <= today) {
    for (const item of activeItems) {
      if (startById.get(item.id)! > date) continue // before it existed
      if (!isDueOn(item, date)) continue
      const acc = perItem.get(item.id)!
      for (const time of item.times) {
        acc.due++
        totalDue++
        if (taken.has(slotKey(item.id, date, time))) {
          acc.taken++
          totalTaken++
        } else {
          missedByDate.set(date, (missedByDate.get(date) ?? 0) + 1)
        }
      }
    }
    date = addDays(date, 1)
  }

  const items: ItemAdherence[] = activeItems
    .map((item) => {
      const acc = perItem.get(item.id)!
      return {
        item,
        due: acc.due,
        taken: acc.taken,
        pct: acc.due ? Math.round((acc.taken / acc.due) * 100) : 0,
        streak: currentStreak(item, today, taken),
      }
    })
    .filter((row) => row.due > 0)
    .sort((a, b) => a.item.name.localeCompare(b.item.name))

  // Most missed first; ties broken by most recent. Purely descriptive.
  const missedDays: MissedDay[] = [...missedByDate.entries()]
    .map(([date, missed]) => ({ date, missed }))
    .sort((a, b) => b.missed - a.missed || b.date.localeCompare(a.date))

  return {
    from,
    to: today,
    due: totalDue,
    taken: totalTaken,
    pct: totalDue ? Math.round((totalTaken / totalDue) * 100) : null,
    items,
    missedDays,
  }
}
