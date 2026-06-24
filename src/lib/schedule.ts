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

// Coarse time-of-day buckets. A schedule-time edit only counts as a stack
// change when it crosses one of these boundaries (08:00 → 09:00 stays in
// Morning and is not a change; 08:00 → 13:00 crosses into Afternoon and is).
export type TimeOfDay = 'morning' | 'afternoon' | 'night'

export const TIME_OF_DAY_LABELS: Record<TimeOfDay, string> = {
  morning: 'Morning',
  afternoon: 'Afternoon',
  night: 'Night',
}

// Which bucket an 'HH:mm' falls into: Morning 05:00–11:59, Afternoon
// 12:00–17:59, Night 18:00–04:59 (wraps midnight). Lower edge is inclusive
// (05:00 = morning, 12:00 = afternoon, 18:00 = night).
export function timeOfDayBucket(time: string): TimeOfDay {
  const hour = Number(time.split(':')[0])
  if (hour >= 5 && hour < 12) return 'morning'
  if (hour >= 12 && hour < 18) return 'afternoon'
  return 'night'
}

const BUCKET_ORDER: TimeOfDay[] = ['morning', 'afternoon', 'night']

// The distinct buckets an item's scheduled times occupy, always in
// morning→afternoon→night order so equal sets compare and display identically
// regardless of input order. Empty times → empty array.
export function timeOfDayBuckets(times: string[]): TimeOfDay[] {
  const present = new Set(times.map(timeOfDayBucket))
  return BUCKET_ORDER.filter((bucket) => present.has(bucket))
}
