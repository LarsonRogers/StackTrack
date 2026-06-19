// src/lib/reminders.ts — pure reminder logic: which occurrence (if any) is
// currently due, whether a reminder shows in the advisory, and human-readable
// labels. No state, no I/O. Occurrences are computed from the declarative
// recurrence (never materialized) so a future push backend can reuse this.
import type { Reminder, ReminderRecurrence } from '../db/db'
import { addDays, parseIsoDate } from './dates'

// Whole local-calendar days between two 'YYYY-MM-DD' dates (noon-anchored, so
// DST never shifts the count).
function daysBetween(from: string, to: string): number {
  const ms = parseIsoDate(to).getTime() - parseIsoDate(from).getTime()
  return Math.round(ms / 86_400_000)
}

// The most recent occurrence date on or before `today`, or null if the first
// occurrence is still in the future. For 'cycle' the occurrences are the start
// of each off-period (e.g. the day you should begin cycling off).
export function currentOccurrence(
  recurrence: ReminderRecurrence,
  today: string,
): string | null {
  if (recurrence.kind === 'once') {
    return today >= recurrence.date ? recurrence.date : null
  }

  const offset = daysBetween(recurrence.startDate, today)
  if (offset < 0) return null

  if (recurrence.kind === 'everyNDays') {
    const k = Math.floor(offset / recurrence.n)
    return addDays(recurrence.startDate, k * recurrence.n)
  }

  // cycle: first off-period begins after onWeeks, then repeats every period.
  const firstOff = recurrence.onWeeks * 7
  const period = (recurrence.onWeeks + recurrence.offWeeks) * 7
  if (offset < firstOff) return null // still in the very first on-stretch
  const k = Math.floor((offset - firstOff) / period)
  return addDays(recurrence.startDate, firstOff + k * period)
}

// Whether a reminder should appear in the Today advisory on `today`: active,
// has a current occurrence the user has not yet marked Done, and not snoozed
// past today.
export function isReminderDue(reminder: Reminder, today: string): boolean {
  if (reminder.status !== 'active') return false
  if (reminder.snoozedUntil && today < reminder.snoozedUntil) return false
  const occurrence = currentOccurrence(reminder.recurrence, today)
  if (occurrence === null) return false
  if (reminder.lastAckedDate && reminder.lastAckedDate >= occurrence) {
    return false // already dismissed this occurrence
  }
  return true
}

// Short human-readable cadence label, e.g. "Once on 2026-07-01",
// "Every 30 days", "Cycle off every 4 weeks".
export function describeRecurrence(recurrence: ReminderRecurrence): string {
  if (recurrence.kind === 'once') return `Once on ${recurrence.date}`
  if (recurrence.kind === 'everyNDays') {
    if (recurrence.n === 1) return 'Every day'
    if (recurrence.n === 7) return 'Every week'
    return `Every ${recurrence.n} days`
  }
  const period = recurrence.onWeeks + recurrence.offWeeks
  return `Cycle off every ${period} weeks`
}
