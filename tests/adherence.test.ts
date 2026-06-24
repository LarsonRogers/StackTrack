// tests/adherence.test.ts — pure adherence math (#28): due-vs-taken counting
// across schedules, per-item streaks (with the in-progress-today grace), the
// missed-by-weekday breakdown, and range/start clamping. All deterministic:
// `today` and `rangeStart` are passed in, so no Date mocking is needed.
import { describe, expect, it } from 'vitest'
import type { IntakeRecord, Schedule, StackItem } from '../src/db/db'
import { buildAdherenceReport } from '../src/lib/adherence'
import { parseIsoDate } from '../src/lib/dates'

let nextId = 1
function item(
  name: string,
  opts: { times?: string[]; schedule?: Schedule; created?: string } = {},
): StackItem {
  const id = nextId++
  // Local-format createdAt (no Z) so the local start date is TZ-independent.
  const created = `${opts.created ?? '2026-06-01'}T12:00:00`
  return {
    id,
    uid: `item-${id}`,
    name,
    kind: 'supplement',
    dose: '1',
    times: opts.times ?? ['08:00'],
    groups: [],
    schedule: opts.schedule,
    status: 'active',
    createdAt: created,
    updatedAt: created,
  }
}

function intake(item: StackItem, date: string, time = '08:00'): IntakeRecord {
  return {
    id: nextId++,
    uid: `intake-${nextId}`,
    itemId: item.id,
    itemUid: item.uid,
    date,
    time,
    takenAt: `${date}T08:05:00`,
    updatedAt: `${date}T08:05:00`,
  }
}

describe('buildAdherenceReport — due vs taken', () => {
  it('counts a daily item fully taken as 100%', () => {
    const a = item('Zinc', { created: '2026-06-01' })
    const intakes = ['2026-06-01', '2026-06-02', '2026-06-03'].map((d) =>
      intake(a, d),
    )
    const r = buildAdherenceReport([a], intakes, '2026-06-01', '2026-06-03')
    expect(r.due).toBe(3)
    expect(r.taken).toBe(3)
    expect(r.pct).toBe(100)
    expect(r.items[0].pct).toBe(100)
  })

  it('computes a partial percentage and rounds', () => {
    const a = item('Zinc', { created: '2026-06-01' })
    // 2 of 3 days taken → 67%
    const intakes = ['2026-06-01', '2026-06-03'].map((d) => intake(a, d))
    const r = buildAdherenceReport([a], intakes, '2026-06-01', '2026-06-03')
    expect(r.taken).toBe(2)
    expect(r.due).toBe(3)
    expect(r.pct).toBe(67)
  })

  it('counts each scheduled time as its own dose slot', () => {
    const a = item('Mag', { times: ['08:00', '20:00'], created: '2026-06-01' })
    const intakes = [intake(a, '2026-06-01', '08:00')] // only the morning
    const r = buildAdherenceReport([a], intakes, '2026-06-01', '2026-06-01')
    expect(r.due).toBe(2)
    expect(r.taken).toBe(1)
    expect(r.pct).toBe(50)
  })

  it('honors an everyNDays schedule (only due days count)', () => {
    const schedule: Schedule = {
      kind: 'everyNDays',
      n: 2,
      startDate: '2026-06-01',
    }
    const a = item('EveryOther', { schedule, created: '2026-06-01' })
    // Due on 06-01, 06-03, 06-05 over the window; take only 06-01.
    const r = buildAdherenceReport(
      [a],
      [intake(a, '2026-06-01')],
      '2026-06-01',
      '2026-06-05',
    )
    expect(r.due).toBe(3)
    expect(r.taken).toBe(1)
  })

  it('keeps schedule cadence and the created-date clamp independent', () => {
    // Cadence is anchored to startDate 2026-06-01 (due 06-01, 03, 05, 07…),
    // but the item was created later, on 06-04. Days before 06-04 must not
    // count even though the cadence says 06-01 and 06-03 were "due".
    const schedule: Schedule = {
      kind: 'everyNDays',
      n: 2,
      startDate: '2026-06-01',
    }
    const a = item('Later', { schedule, created: '2026-06-04' })
    // In window 06-01..06-07: cadence due days ≥ created are 06-05 and 06-07.
    const r = buildAdherenceReport(
      [a],
      [intake(a, '2026-06-05')],
      '2026-06-01',
      '2026-06-07',
    )
    expect(r.due).toBe(2)
    expect(r.taken).toBe(1)
  })

  it('does not count days before the item was created', () => {
    const a = item('Late', { created: '2026-06-04' })
    // Range starts 06-01 but the item only existed from 06-04 → 2 due days.
    const r = buildAdherenceReport(
      [a],
      [intake(a, '2026-06-04'), intake(a, '2026-06-05')],
      '2026-06-01',
      '2026-06-05',
    )
    expect(r.due).toBe(2)
    expect(r.pct).toBe(100)
  })

  it('returns pct null when nothing was due in the range', () => {
    const schedule: Schedule = {
      kind: 'everyNDays',
      n: 30,
      startDate: '2026-06-01',
    }
    const a = item('Rare', { schedule, created: '2026-06-01' })
    // Due 06-01 only within window; range 06-02..06-03 has no due day.
    const r = buildAdherenceReport([a], [], '2026-06-02', '2026-06-03')
    expect(r.pct).toBeNull()
    expect(r.items).toEqual([])
  })

  it('aggregates the overall percentage across items, sorted by name', () => {
    const a = item('Boron', { created: '2026-06-01' })
    const b = item('Apple', { created: '2026-06-01' })
    // Boron taken both days; Apple taken 1 of 2 → overall 3/4 = 75%.
    const intakes = [
      intake(a, '2026-06-01'),
      intake(a, '2026-06-02'),
      intake(b, '2026-06-01'),
    ]
    const r = buildAdherenceReport([a, b], intakes, '2026-06-01', '2026-06-02')
    expect(r.pct).toBe(75)
    expect(r.items.map((i) => i.item.name)).toEqual(['Apple', 'Boron'])
  })

  it("'all' range (null start) counts from the earliest item", () => {
    const a = item('Zinc', { created: '2026-06-02' })
    const r = buildAdherenceReport(
      [a],
      [intake(a, '2026-06-02'), intake(a, '2026-06-03')],
      null,
      '2026-06-03',
    )
    expect(r.from).toBe('2026-06-02')
    expect(r.due).toBe(2)
  })
})

describe('buildAdherenceReport — streaks', () => {
  it('counts consecutive most-recent due days fully taken', () => {
    const a = item('Zinc', { created: '2026-06-01' })
    const intakes = ['2026-06-01', '2026-06-02', '2026-06-03'].map((d) =>
      intake(a, d),
    )
    const r = buildAdherenceReport([a], intakes, '2026-06-01', '2026-06-03')
    expect(r.items[0].streak).toBe(3)
  })

  it('breaks the streak at the first past day not fully taken', () => {
    const a = item('Zinc', { created: '2026-06-01' })
    // Missed 06-02; took 06-01 and 06-03. Streak as of 06-03 = 1.
    const intakes = [intake(a, '2026-06-01'), intake(a, '2026-06-03')]
    const r = buildAdherenceReport([a], intakes, '2026-06-01', '2026-06-03')
    expect(r.items[0].streak).toBe(1)
  })

  it('does not break the streak for an unticked TODAY (day in progress)', () => {
    const a = item('Zinc', { created: '2026-06-01' })
    // Took 06-01, 06-02; today 06-03 not yet taken → streak still 2, not 0.
    const intakes = [intake(a, '2026-06-01'), intake(a, '2026-06-02')]
    const r = buildAdherenceReport([a], intakes, '2026-06-01', '2026-06-03')
    expect(r.items[0].streak).toBe(2)
  })

  it('walks a daysOfWeek streak, skipping a today that is not a due day', () => {
    const today = '2026-06-10'
    const dueA = '2026-06-08'
    const dueB = '2026-06-09'
    // Schedule is due on the weekdays of the two prior days. today (06-10) is a
    // third, distinct weekday → not due, so the streak walk must skip it
    // (neither count nor break) and still credit the two prior due days.
    const schedule: Schedule = {
      kind: 'daysOfWeek',
      days: [parseIsoDate(dueA).getDay(), parseIsoDate(dueB).getDay()],
    }
    const a = item('FixedDays', { schedule, created: '2026-06-01' })
    const r = buildAdherenceReport(
      [a],
      [intake(a, dueA), intake(a, dueB)],
      '2026-06-01',
      today,
    )
    expect(r.items[0].streak).toBe(2)
  })

  it('requires every scheduled time that day for the streak', () => {
    const a = item('Mag', { times: ['08:00', '20:00'], created: '2026-06-01' })
    // 06-01 both taken; 06-02 only morning → streak as of 06-02 is 0
    // (today 06-02 is incomplete → skipped; previous due day 06-01 full → 1).
    const intakes = [
      intake(a, '2026-06-01', '08:00'),
      intake(a, '2026-06-01', '20:00'),
      intake(a, '2026-06-02', '08:00'),
    ]
    const r = buildAdherenceReport([a], intakes, '2026-06-01', '2026-06-02')
    expect(r.items[0].streak).toBe(1)
  })
})

describe('missedDays', () => {
  it('lists days with missed doses, most-missed then most-recent first', () => {
    const a = item('Zinc', { created: '2026-06-01' })
    const b = item('Mag', { created: '2026-06-01' })
    // Daily 06-01..06-03. Miss both items on 06-02 (2 misses) and only Mag on
    // 06-03 (1 miss) → 06-02 ranks first by count.
    const intakes = [
      intake(a, '2026-06-01'),
      intake(b, '2026-06-01'),
      intake(a, '2026-06-03'),
    ]
    const r = buildAdherenceReport([a, b], intakes, '2026-06-01', '2026-06-03')
    expect(r.missedDays).toEqual([
      { date: '2026-06-02', missed: 2 },
      { date: '2026-06-03', missed: 1 },
    ])
  })

  it('is empty when nothing was missed', () => {
    const a = item('Zinc', { created: '2026-06-01' })
    const r = buildAdherenceReport(
      [a],
      [intake(a, '2026-06-01'), intake(a, '2026-06-02')],
      '2026-06-01',
      '2026-06-02',
    )
    expect(r.missedDays).toEqual([])
  })
})
