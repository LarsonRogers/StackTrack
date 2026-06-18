// src/lib/schedule.ts — pure recurrence logic: whether an item is due on a
// given local date, and a human-readable label for its cadence. No state, no
// I/O. An absent schedule means "every day" (the back-compatible default).
import type { Schedule, StackItem } from '../db/db'
import { parseIsoDate } from './dates'

const WEEKDAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

// Whole local-calendar days from `from` to `to` (negative if `to` is earlier).
// parseIsoDate anchors at noon, so DST shifts never move the day count.
function daysBetween(from: string, to: string): number {
  const ms = parseIsoDate(to).getTime() - parseIsoDate(from).getTime()
  return Math.round(ms / 86_400_000)
}

// Whether an item should appear on `isoDate` ('YYYY-MM-DD'). Undefined
// schedule ⇒ every day. Items are never due before their startDate.
export function isDueOn(item: StackItem, isoDate: string): boolean {
  return isScheduleDueOn(item.schedule, isoDate)
}

export function isScheduleDueOn(
  schedule: Schedule | undefined,
  isoDate: string,
): boolean {
  if (!schedule) return true

  if (schedule.kind === 'daysOfWeek') {
    const weekday = parseIsoDate(isoDate).getDay()
    return schedule.days.includes(weekday)
  }

  const offset = daysBetween(schedule.startDate, isoDate)
  if (offset < 0) return false // not due before it starts

  if (schedule.kind === 'everyNDays') {
    return offset % schedule.n === 0
  }

  // cycle: on for onWeeks, then off for offWeeks, repeating from startDate.
  const periodDays = (schedule.onWeeks + schedule.offWeeks) * 7
  if (periodDays === 0) return true // degenerate guard; normalizer prevents this
  return offset % periodDays < schedule.onWeeks * 7
}

// Short human-readable label, e.g. "Every other day", "Mon, Wed, Fri",
// "3 weeks on, 1 week off". Returns null for the every-day default (callers
// show nothing extra). Used on the Stack card and in change summaries.
export function describeSchedule(
  schedule: Schedule | undefined,
): string | null {
  if (!schedule) return null

  if (schedule.kind === 'everyNDays') {
    return schedule.n === 2 ? 'Every other day' : `Every ${schedule.n} days`
  }

  if (schedule.kind === 'daysOfWeek') {
    const ordered = [...schedule.days].sort((a, b) => a - b)
    return ordered.map((d) => WEEKDAY_NAMES[d]).join(', ')
  }

  return `${weeks(schedule.onWeeks)} on, ${weeks(schedule.offWeeks)} off`
}

function weeks(n: number): string {
  return n === 1 ? '1 week' : `${n} weeks`
}
