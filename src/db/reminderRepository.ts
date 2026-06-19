// src/db/reminderRepository.ts — the only write path for reminders. Reminders
// archive (never hard-delete), mirroring items/metrics. Acknowledging records
// which occurrence was dismissed; snoozing suppresses the advisory for N days.
import {
  db,
  type Reminder,
  type ReminderEventAction,
  type ReminderRecurrence,
} from './db'
import { addDays, toIsoDate } from '../lib/dates'
import { currentOccurrence } from '../lib/reminders'
import { newUid, nowIso } from '../lib/identity'

export interface ReminderInput {
  text: string
  itemUid?: string // optional link to a stack item (by uid)
  recurrence: ReminderRecurrence
  time?: string // 'HH:mm' optional time-of-day
}

// Collapses a recurrence to canonical form: integer counts, with a floor of 1
// (a sub-1 interval / on / off period is meaningless). Times of day and dates
// are taken as given (validated in the form).
function normalizeRecurrence(
  recurrence: ReminderRecurrence,
): ReminderRecurrence {
  if (recurrence.kind === 'everyNDays') {
    return {
      kind: 'everyNDays',
      n: Math.max(1, Math.floor(recurrence.n)),
      startDate: recurrence.startDate,
    }
  }
  if (recurrence.kind === 'cycle') {
    return {
      kind: 'cycle',
      onWeeks: Math.max(1, Math.floor(recurrence.onWeeks)),
      offWeeks: Math.max(1, Math.floor(recurrence.offWeeks)),
      startDate: recurrence.startDate,
    }
  }
  return recurrence // 'once'
}

function normalizeInput(input: ReminderInput): {
  text: string
  itemUid?: string
  recurrence: ReminderRecurrence
  time?: string
} {
  return {
    text: input.text.trim(),
    itemUid: input.itemUid || undefined,
    recurrence: normalizeRecurrence(input.recurrence),
    time: input.time || undefined,
  }
}

export async function addReminder(input: ReminderInput): Promise<number> {
  const stamp = nowIso()
  return db.reminders.add({
    uid: newUid(),
    ...normalizeInput(input),
    status: 'active',
    createdAt: stamp,
    updatedAt: stamp,
  })
}

export async function updateReminder(
  id: number,
  input: ReminderInput,
): Promise<void> {
  const existing = await mustGet(id)
  const normalized = normalizeInput(input)
  // Changing the recurrence shifts the occurrence grid, so a stale ack/snooze
  // (anchored to the OLD grid) would wrongly suppress the edited reminder.
  // Reset them when the recurrence changes; preserve them for text/time edits.
  const recurrenceChanged =
    JSON.stringify(existing.recurrence) !==
    JSON.stringify(normalized.recurrence)
  await db.reminders.put({
    ...existing,
    ...normalized,
    lastAckedDate: recurrenceChanged ? undefined : existing.lastAckedDate,
    snoozedUntil: recurrenceChanged ? undefined : existing.snoozedUntil,
    updatedAt: nowIso(),
  })
}

export async function archiveReminder(id: number): Promise<void> {
  await db.reminders.update(id, { status: 'archived', updatedAt: nowIso() })
}

export async function unarchiveReminder(id: number): Promise<void> {
  await db.reminders.update(id, { status: 'active', updatedAt: nowIso() })
}

// Appends one immutable row to the per-occurrence reminder history (#25 Task C).
// Caller supplies the surrounding transaction so the event lands atomically
// with the reminder update it records.
async function recordEvent(
  reminderUid: string,
  occurrenceDate: string,
  action: ReminderEventAction,
  stamp: string,
  snoozedUntil?: string,
): Promise<void> {
  await db.reminderEvents.add({
    uid: newUid(),
    reminderUid,
    occurrenceDate,
    action,
    snoozedUntil,
    at: stamp,
    updatedAt: stamp,
  })
}

// Marks the occurrence due on `today` as done so it leaves the advisory. A
// 'once' reminder is finished, so it auto-archives; recurring/cycle reminders
// stay active and reappear at their next occurrence. Clears any snooze. Records
// a 'done' history row in the same transaction.
export async function acknowledgeReminder(
  id: number,
  today: string,
): Promise<void> {
  await db.transaction('rw', db.reminders, db.reminderEvents, async () => {
    const reminder = await mustGet(id)
    const occurrence = currentOccurrence(reminder.recurrence, today) ?? today
    const stamp = nowIso()
    await db.reminders.update(id, {
      lastAckedDate: occurrence,
      snoozedUntil: undefined,
      status:
        reminder.recurrence.kind === 'once' ? 'archived' : reminder.status,
      updatedAt: stamp,
    })
    await recordEvent(reminder.uid, occurrence, 'done', stamp)
  })
}

// Hides the reminder from the advisory until `days` from today. Records a
// 'snoozed' history row in the same transaction.
export async function snoozeReminder(
  id: number,
  today: string,
  days: number,
): Promise<void> {
  await db.transaction('rw', db.reminders, db.reminderEvents, async () => {
    const reminder = await mustGet(id)
    const occurrence = currentOccurrence(reminder.recurrence, today) ?? today
    const snoozedUntil = addDays(today, Math.max(1, Math.floor(days)))
    const stamp = nowIso()
    await db.reminders.update(id, {
      snoozedUntil,
      updatedAt: stamp,
    })
    await recordEvent(reminder.uid, occurrence, 'snoozed', stamp, snoozedUntil)
  })
}

export function todayIso(): string {
  return toIsoDate(new Date())
}

async function mustGet(id: number): Promise<Reminder> {
  const reminder = await db.reminders.get(id)
  if (!reminder) throw new Error(`Reminder ${id} not found`)
  return reminder
}
