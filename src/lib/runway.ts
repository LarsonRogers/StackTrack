// src/lib/runway.ts — pure refill-runway projection (backlog #27): given an
// item's count on hand and its schedule, work out when it runs out. No state,
// no I/O. The count is taken as the amount available at the START of
// quantityAsOf; consumption is then projected forward over the schedule (it
// does NOT depend on whether intakes were logged — decided 2026-06-19).
import type { StackItem } from '../db/db'
import { addDays, parseIsoDate } from './dates'
import { isDueOn } from './schedule'

// Stop projecting after this many days — an item with a huge supply or a very
// sparse schedule is treated as "not estimable" rather than looping forever.
const MAX_HORIZON_DAYS = 3650 // ~10 years

// Units consumed on a day the item is due: one per scheduled time, times the
// per-dose count (default 1). Zero if the item has no times (nothing to project).
export function consumptionPerDueDay(item: StackItem): number {
  return item.times.length * (item.unitsPerDose ?? 1)
}

// Whole local-calendar days from `from` to `to` (negative if `to` is earlier).
function daysBetween(from: string, to: string): number {
  const ms = parseIsoDate(to).getTime() - parseIsoDate(from).getTime()
  return Math.round(ms / 86_400_000)
}

// The local date the item runs out — the first due day its remaining stock
// can no longer cover a full day's doses. Null when runway isn't tracked
// (no count / no anchor), the consumption rate is zero, or it wouldn't deplete
// within the projection horizon.
export function projectRunOutDate(item: StackItem): string | null {
  if (item.quantityOnHand === undefined || item.quantityAsOf === undefined) {
    return null
  }
  const rate = consumptionPerDueDay(item)
  if (rate <= 0) return null

  let remaining = item.quantityOnHand
  let date = item.quantityAsOf
  for (let day = 0; day <= MAX_HORIZON_DAYS; day++) {
    if (isDueOn(item, date)) {
      // A fractional remainder smaller than a full dose can't cover this day —
      // you can't take a partial last dose — so it runs out here.
      if (remaining < rate) return date // can't cover this due day → out
      remaining -= rate
    }
    date = addDays(date, 1)
  }
  return null // still supplied past the horizon — treat as not estimable
}

// Whole days from `today` until the item runs out. Null when not trackable.
// Can be ≤ 0 when the projected run-out date is today or already past.
export function daysOfSupplyLeft(
  item: StackItem,
  today: string,
): number | null {
  const runOut = projectRunOutDate(item)
  if (runOut === null) return null
  return daysBetween(today, runOut)
}

// Short label for the Stack row, e.g. "≈12 days left", "1 day left",
// "Refill now". Null when runway isn't tracked (caller shows nothing).
export function describeRunway(item: StackItem, today: string): string | null {
  const days = daysOfSupplyLeft(item, today)
  if (days === null) return null
  if (days <= 0) return 'Refill now'
  return `≈${days} day${days === 1 ? '' : 's'} left`
}
