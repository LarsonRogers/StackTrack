// tests/schedule.test.ts — pure recurrence logic: isDueOn for each schedule
// kind (with start-date and cycle boundaries) and the human-readable labels.
import { describe, expect, it } from 'vitest'
import type { Schedule, StackItem } from '../src/db/db'
import { describeSchedule, isDueOn, isScheduleDueOn } from '../src/lib/schedule'

function itemWith(schedule?: Schedule): StackItem {
  return {
    id: 1,
    uid: 'item-1',
    name: 'KSM-66',
    kind: 'supplement',
    dose: '600',
    times: ['08:00'],
    groups: [],
    schedule,
    status: 'active',
    createdAt: '2026-06-01T08:00:00.000Z',
    updatedAt: '2026-06-01T08:00:00.000Z',
  }
}

describe('isDueOn', () => {
  it('treats an absent schedule as every day', () => {
    const item = itemWith(undefined)
    expect(isDueOn(item, '2026-06-01')).toBe(true)
    expect(isDueOn(item, '2030-12-31')).toBe(true)
  })

  describe('everyNDays', () => {
    const sched: Schedule = {
      kind: 'everyNDays',
      n: 2,
      startDate: '2026-06-01',
    }

    it('is due on the start date and every Nth day after', () => {
      expect(isScheduleDueOn(sched, '2026-06-01')).toBe(true) // offset 0
      expect(isScheduleDueOn(sched, '2026-06-02')).toBe(false) // offset 1
      expect(isScheduleDueOn(sched, '2026-06-03')).toBe(true) // offset 2
    })

    it('is never due before the start date', () => {
      expect(isScheduleDueOn(sched, '2026-05-31')).toBe(false)
    })

    it('handles larger intervals', () => {
      const every3: Schedule = {
        kind: 'everyNDays',
        n: 3,
        startDate: '2026-06-01',
      }
      expect(isScheduleDueOn(every3, '2026-06-04')).toBe(true) // offset 3
      expect(isScheduleDueOn(every3, '2026-06-05')).toBe(false)
    })
  })

  describe('daysOfWeek', () => {
    // 2026-06-15 is a Monday; 16 Tue; 17 Wed.
    const sched: Schedule = { kind: 'daysOfWeek', days: [1, 3, 5] } // Mon/Wed/Fri

    it('is due only on the listed weekdays', () => {
      expect(isScheduleDueOn(sched, '2026-06-15')).toBe(true) // Mon
      expect(isScheduleDueOn(sched, '2026-06-16')).toBe(false) // Tue
      expect(isScheduleDueOn(sched, '2026-06-17')).toBe(true) // Wed
    })
  })

  describe('cycle', () => {
    // 3 weeks on (21 days), 1 week off (7 days), from 2026-06-01.
    const sched: Schedule = {
      kind: 'cycle',
      onWeeks: 3,
      offWeeks: 1,
      startDate: '2026-06-01',
    }

    it('is due through the on-weeks and not during the off-week', () => {
      expect(isScheduleDueOn(sched, '2026-06-01')).toBe(true) // offset 0, on
      expect(isScheduleDueOn(sched, '2026-06-21')).toBe(true) // offset 20, last on day
      expect(isScheduleDueOn(sched, '2026-06-22')).toBe(false) // offset 21, off
      expect(isScheduleDueOn(sched, '2026-06-28')).toBe(false) // offset 27, off
    })

    it('repeats after the full period', () => {
      expect(isScheduleDueOn(sched, '2026-06-29')).toBe(true) // offset 28, on again
    })

    it('is never due before the start date', () => {
      expect(isScheduleDueOn(sched, '2026-05-31')).toBe(false)
    })
  })
})

describe('describeSchedule', () => {
  it('labels every cadence and returns null for the daily default', () => {
    expect(describeSchedule(undefined)).toBeNull()
    expect(
      describeSchedule({ kind: 'everyNDays', n: 2, startDate: '2026-06-01' }),
    ).toBe('Every other day')
    expect(
      describeSchedule({ kind: 'everyNDays', n: 3, startDate: '2026-06-01' }),
    ).toBe('Every 3 days')
    expect(describeSchedule({ kind: 'daysOfWeek', days: [5, 1, 3] })).toBe(
      'Mon, Wed, Fri',
    )
    expect(
      describeSchedule({
        kind: 'cycle',
        onWeeks: 3,
        offWeeks: 1,
        startDate: '2026-06-01',
      }),
    ).toBe('3 weeks on, 1 week off')
  })
})
