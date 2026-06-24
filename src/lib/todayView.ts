// src/lib/todayView.ts — pure view-shaping helpers for the Today screen.
// No state, no db access.
import type { StackItem } from '../db/db'
import { isDueOn } from './schedule'

// One checklist row: an item due at one of its scheduled times.
export interface ChecklistEntry {
  item: StackItem
  time: string // 'HH:mm'
}

export interface TimeSection {
  time: string // 'HH:mm'
  entries: ChecklistEntry[]
}

// How cards are ordered WITHIN each time section (#37). Time-of-day grouping
// is fixed; this only reorders entries inside a section. 'custom' is the manual
// drag order (#38b), ranked per section by StackItem.todayOrder[time].
export type TodaySortMode = 'name' | 'nameDesc' | 'added' | 'custom'

export const TODAY_SORT_LABELS: Record<TodaySortMode, string> = {
  name: 'Name (A→Z)',
  nameDesc: 'Name (Z→A)',
  added: 'Recently added',
  custom: 'Custom (drag)',
}

// Comparator for entries sharing a time section. 'added' is newest-first by
// createdAt (ISO strings compare correctly), ties broken by name. 'custom'
// ranks by the per-section manual order (#38b): both entries share this
// section's time, so todayOrder[a.time] is the rank; unranked items (key
// absent — e.g. newly added) sort to the END by name. Ranks are compared
// directly (not subtracted) to avoid the Infinity − Infinity = NaN trap.
function compareEntries(
  a: ChecklistEntry,
  b: ChecklistEntry,
  mode: TodaySortMode,
): number {
  if (mode === 'nameDesc') return b.item.name.localeCompare(a.item.name)
  if (mode === 'added') {
    return (
      b.item.createdAt.localeCompare(a.item.createdAt) ||
      a.item.name.localeCompare(b.item.name)
    )
  }
  if (mode === 'custom') {
    const ao = a.item.todayOrder?.[a.time] ?? Infinity
    const bo = b.item.todayOrder?.[b.time] ?? Infinity
    if (ao !== bo) return ao < bo ? -1 : 1
    return a.item.name.localeCompare(b.item.name)
  }
  return a.item.name.localeCompare(b.item.name)
}

// Expands active items into time-of-day sections for `date`: an item
// scheduled at 08:00 and 20:00 appears in both. Items not due on `date`
// (per their recurrence schedule) are excluded. Sections chronological
// ('HH:mm' strings sort correctly); entries ordered within a section by
// `sortMode` (default A→Z).
export function buildTimeSections(
  items: StackItem[],
  date: string,
  sortMode: TodaySortMode = 'name',
): TimeSection[] {
  const byTime = new Map<string, ChecklistEntry[]>()
  for (const item of items) {
    if (!isDueOn(item, date)) continue
    for (const time of item.times) {
      const entries = byTime.get(time) ?? []
      entries.push({ item, time })
      byTime.set(time, entries)
    }
  }

  return [...byTime.entries()]
    .map(([time, entries]) => ({
      time,
      entries: entries.toSorted((a, b) => compareEntries(a, b, sortMode)),
    }))
    .toSorted((a, b) => a.time.localeCompare(b.time))
}
