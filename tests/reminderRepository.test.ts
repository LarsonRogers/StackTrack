// tests/reminderRepository.test.ts — behavior tests for the reminder write
// path: create/normalize, edit, archive, acknowledge (with once auto-archive),
// and snooze.
import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '../src/db/db'
import {
  acknowledgeReminder,
  addReminder,
  archiveReminder,
  snoozeReminder,
  updateReminder,
} from '../src/db/reminderRepository'

const TODAY = '2026-06-18'

beforeEach(async () => {
  await db.reminders.clear()
})

describe('addReminder', () => {
  it('creates an active reminder and normalizes counts', async () => {
    const id = await addReminder({
      text: '  Refill prescription  ',
      recurrence: { kind: 'everyNDays', n: 30.7, startDate: '2026-06-01' },
    })
    const reminder = await db.reminders.get(id)
    expect(reminder).toMatchObject({
      text: 'Refill prescription',
      status: 'active',
      recurrence: { kind: 'everyNDays', n: 30, startDate: '2026-06-01' },
    })
    expect(reminder?.uid).toBeTruthy()
  })

  it('floors a cycle to whole weeks of at least 1', async () => {
    const id = await addReminder({
      text: 'Cycle off',
      recurrence: { kind: 'cycle', onWeeks: 3, offWeeks: 0, startDate: TODAY },
    })
    expect((await db.reminders.get(id))?.recurrence).toEqual({
      kind: 'cycle',
      onWeeks: 3,
      offWeeks: 1, // floored up from 0
      startDate: TODAY,
    })
  })
})

describe('updateReminder', () => {
  it('edits text, recurrence, time, and linked item', async () => {
    const id = await addReminder({
      text: 'Old',
      recurrence: { kind: 'once', date: TODAY },
    })
    await updateReminder(id, {
      text: 'New',
      recurrence: { kind: 'everyNDays', n: 14, startDate: '2026-06-01' },
      time: '09:00',
      itemUid: 'item-uid-1',
    })
    expect(await db.reminders.get(id)).toMatchObject({
      text: 'New',
      time: '09:00',
      itemUid: 'item-uid-1',
      recurrence: { kind: 'everyNDays', n: 14 },
    })
  })

  it('resets ack/snooze when the recurrence changes, but keeps them for text edits', async () => {
    const id = await addReminder({
      text: 'Weekly',
      recurrence: { kind: 'everyNDays', n: 7, startDate: '2026-06-01' },
    })
    await snoozeReminder(id, TODAY, 3)
    await acknowledgeReminder(id, TODAY)

    // Edit only the text → ack/snooze (well, snooze was cleared by ack) kept.
    await updateReminder(id, {
      text: 'Weekly vitamins',
      recurrence: { kind: 'everyNDays', n: 7, startDate: '2026-06-01' },
    })
    expect((await db.reminders.get(id))?.lastAckedDate).toBe('2026-06-15')

    // Edit the recurrence (grid shifts) → ack cleared so it can surface again.
    await updateReminder(id, {
      text: 'Weekly vitamins',
      recurrence: { kind: 'everyNDays', n: 14, startDate: '2026-06-01' },
    })
    expect((await db.reminders.get(id))?.lastAckedDate).toBeUndefined()
  })
})

describe('acknowledgeReminder', () => {
  it('records the occurrence and keeps a recurring reminder active', async () => {
    const id = await addReminder({
      text: 'Weekly',
      recurrence: { kind: 'everyNDays', n: 7, startDate: '2026-06-01' },
    })
    await acknowledgeReminder(id, TODAY)
    const reminder = await db.reminders.get(id)
    expect(reminder?.lastAckedDate).toBe('2026-06-15') // current occurrence
    expect(reminder?.status).toBe('active')
  })

  it('auto-archives a one-off when done', async () => {
    const id = await addReminder({
      text: 'Blood test',
      recurrence: { kind: 'once', date: TODAY },
    })
    await acknowledgeReminder(id, TODAY)
    expect((await db.reminders.get(id))?.status).toBe('archived')
  })

  it('clears a snooze on acknowledge', async () => {
    const id = await addReminder({
      text: 'Weekly',
      recurrence: { kind: 'everyNDays', n: 7, startDate: '2026-06-01' },
    })
    await snoozeReminder(id, TODAY, 3)
    await acknowledgeReminder(id, TODAY)
    expect((await db.reminders.get(id))?.snoozedUntil).toBeUndefined()
  })
})

describe('snoozeReminder', () => {
  it('hides the reminder until N days from today', async () => {
    const id = await addReminder({
      text: 'Weekly',
      recurrence: { kind: 'everyNDays', n: 7, startDate: '2026-06-01' },
    })
    await snoozeReminder(id, TODAY, 2)
    expect((await db.reminders.get(id))?.snoozedUntil).toBe('2026-06-20')
  })
})

describe('archiveReminder', () => {
  it('archives without deleting', async () => {
    const id = await addReminder({
      text: 'Once',
      recurrence: { kind: 'once', date: TODAY },
    })
    await archiveReminder(id)
    expect((await db.reminders.get(id))?.status).toBe('archived')
    expect(await db.reminders.count()).toBe(1)
  })
})
