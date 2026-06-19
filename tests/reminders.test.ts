// tests/reminders.test.ts — pure reminder logic: which occurrence is current
// for each recurrence kind (with boundaries), whether a reminder is due given
// ack/snooze/status, and the cadence labels.
import { describe, expect, it } from 'vitest'
import type { Reminder, ReminderRecurrence } from '../src/db/db'
import {
  currentOccurrence,
  describeRecurrence,
  isReminderDue,
} from '../src/lib/reminders'

function reminder(
  recurrence: ReminderRecurrence,
  extra: Partial<Reminder> = {},
): Reminder {
  return {
    id: 1,
    uid: 'r1',
    text: 'Cycle off KSM-66',
    recurrence,
    status: 'active',
    createdAt: '2026-06-01T00:00:00.000Z',
    updatedAt: '2026-06-01T00:00:00.000Z',
    ...extra,
  }
}

describe('currentOccurrence', () => {
  it('once: null before the date, then the date itself', () => {
    const r: ReminderRecurrence = { kind: 'once', date: '2026-07-01' }
    expect(currentOccurrence(r, '2026-06-18')).toBeNull()
    expect(currentOccurrence(r, '2026-07-01')).toBe('2026-07-01')
    expect(currentOccurrence(r, '2026-07-05')).toBe('2026-07-01')
  })

  it('everyNDays: the most recent multiple from the start date', () => {
    const r: ReminderRecurrence = {
      kind: 'everyNDays',
      n: 7,
      startDate: '2026-06-01',
    }
    expect(currentOccurrence(r, '2026-05-31')).toBeNull()
    expect(currentOccurrence(r, '2026-06-08')).toBe('2026-06-08')
    expect(currentOccurrence(r, '2026-06-18')).toBe('2026-06-15') // offset 17 → k=2
  })

  it('cycle: null until the first off-period, then each off-period start', () => {
    const r: ReminderRecurrence = {
      kind: 'cycle',
      onWeeks: 3,
      offWeeks: 1,
      startDate: '2026-06-01',
    }
    expect(currentOccurrence(r, '2026-06-21')).toBeNull() // offset 20 < 21
    expect(currentOccurrence(r, '2026-06-22')).toBe('2026-06-22') // offset 21
    expect(currentOccurrence(r, '2026-07-20')).toBe('2026-07-20') // offset 49 → k=1
  })
})

describe('isReminderDue', () => {
  const r: ReminderRecurrence = { kind: 'once', date: '2026-06-18' }

  it('is due when active, occurring, unacked, and not snoozed', () => {
    expect(isReminderDue(reminder(r), '2026-06-18')).toBe(true)
  })

  it('is not due before its occurrence', () => {
    expect(isReminderDue(reminder(r), '2026-06-17')).toBe(false)
  })

  it('is not due once acknowledged for that occurrence', () => {
    expect(
      isReminderDue(reminder(r, { lastAckedDate: '2026-06-18' }), '2026-06-18'),
    ).toBe(false)
  })

  it('is not due while snoozed past today', () => {
    expect(
      isReminderDue(reminder(r, { snoozedUntil: '2026-06-20' }), '2026-06-18'),
    ).toBe(false)
    // snooze expired → due again
    expect(
      isReminderDue(reminder(r, { snoozedUntil: '2026-06-18' }), '2026-06-18'),
    ).toBe(true)
  })

  it('is never due when archived', () => {
    expect(
      isReminderDue(reminder(r, { status: 'archived' }), '2026-06-18'),
    ).toBe(false)
  })

  it('a recurring reminder reappears at its next occurrence after an ack', () => {
    const weekly = reminder(
      { kind: 'everyNDays', n: 7, startDate: '2026-06-01' },
      { lastAckedDate: '2026-06-08' },
    )
    expect(isReminderDue(weekly, '2026-06-08')).toBe(false) // acked occurrence
    expect(isReminderDue(weekly, '2026-06-15')).toBe(true) // next occurrence
  })
})

describe('describeRecurrence', () => {
  it('labels each kind', () => {
    expect(describeRecurrence({ kind: 'once', date: '2026-07-01' })).toBe(
      'Once on 2026-07-01',
    )
    expect(
      describeRecurrence({ kind: 'everyNDays', n: 1, startDate: '2026-06-01' }),
    ).toBe('Every day')
    expect(
      describeRecurrence({ kind: 'everyNDays', n: 7, startDate: '2026-06-01' }),
    ).toBe('Every week')
    expect(
      describeRecurrence({
        kind: 'everyNDays',
        n: 30,
        startDate: '2026-06-01',
      }),
    ).toBe('Every 30 days')
    expect(
      describeRecurrence({
        kind: 'cycle',
        onWeeks: 3,
        offWeeks: 1,
        startDate: '2026-06-01',
      }),
    ).toBe('Cycle off every 4 weeks')
  })
})
