// tests/runway.test.ts — pure refill-runway projection (#27): days of supply
// left, projected from the schedule, with the count anchored to quantityAsOf.
import { describe, expect, it } from 'vitest'
import type { StackItem } from '../src/db/db'
import {
  consumptionPerDueDay,
  daysOfSupplyLeft,
  describeRunway,
  projectRunOutDate,
} from '../src/lib/runway'

// Minimal StackItem with the fields runway reads; overrides applied on top.
function item(overrides: Partial<StackItem> = {}): StackItem {
  return {
    id: 1,
    uid: 'uid-1',
    name: 'Zinc',
    kind: 'supplement',
    dose: '25 mg',
    times: ['08:00'],
    groups: [],
    status: 'active',
    createdAt: '2026-06-01T00:00:00.000Z',
    updatedAt: '2026-06-01T00:00:00.000Z',
    ...overrides,
  }
}

describe('consumptionPerDueDay', () => {
  it('is times × unitsPerDose (default 1)', () => {
    expect(consumptionPerDueDay(item({ times: ['08:00'] }))).toBe(1)
    expect(consumptionPerDueDay(item({ times: ['08:00', '20:00'] }))).toBe(2)
    expect(
      consumptionPerDueDay(item({ times: ['08:00'], unitsPerDose: 2 })),
    ).toBe(2)
    expect(
      consumptionPerDueDay(
        item({ times: ['08:00', '20:00'], unitsPerDose: 2 }),
      ),
    ).toBe(4)
  })
})

describe('daysOfSupplyLeft — daily item', () => {
  it('a 30-count once-daily item lasts 30 days from the anchor', () => {
    const zinc = item({ quantityOnHand: 30, quantityAsOf: '2026-06-01' })
    expect(daysOfSupplyLeft(zinc, '2026-06-01')).toBe(30)
    expect(projectRunOutDate(zinc)).toBe('2026-07-01')
  })

  it('twice-daily halves the runway', () => {
    const zinc = item({
      times: ['08:00', '20:00'],
      quantityOnHand: 30,
      quantityAsOf: '2026-06-01',
    })
    expect(daysOfSupplyLeft(zinc, '2026-06-01')).toBe(15)
  })

  it('units-per-dose depletes faster', () => {
    const zinc = item({
      unitsPerDose: 2,
      quantityOnHand: 30,
      quantityAsOf: '2026-06-01',
    })
    expect(daysOfSupplyLeft(zinc, '2026-06-01')).toBe(15)
  })

  it('counts elapsed days since the count was taken', () => {
    const zinc = item({ quantityOnHand: 30, quantityAsOf: '2026-06-01' })
    expect(daysOfSupplyLeft(zinc, '2026-06-11')).toBe(20) // 10 days consumed
  })

  it('back-dates a past refill (subscription mid-phase)', () => {
    // Refilled 28, once daily, two weeks ago → ~14 days left now.
    const zinc = item({ quantityOnHand: 28, quantityAsOf: '2026-06-05' })
    expect(daysOfSupplyLeft(zinc, '2026-06-19')).toBe(14)
  })
})

describe('daysOfSupplyLeft — non-daily schedules', () => {
  it('every-other-day stretches the runway', () => {
    const zinc = item({
      schedule: { kind: 'everyNDays', n: 2, startDate: '2026-06-01' },
      quantityOnHand: 10,
      quantityAsOf: '2026-06-01',
    })
    // 10 doses consumed on Jun 1,3,…,19; runs out on the next due day, Jun 21.
    expect(daysOfSupplyLeft(zinc, '2026-06-01')).toBe(20)
  })
})

describe('describeRunway labels', () => {
  it('pluralizes and flags refill', () => {
    expect(
      describeRunway(
        item({ quantityOnHand: 12, quantityAsOf: '2026-06-01' }),
        '2026-06-01',
      ),
    ).toBe('≈12 days left')
    expect(
      describeRunway(
        item({ quantityOnHand: 1, quantityAsOf: '2026-06-01' }),
        '2026-06-01',
      ),
    ).toBe('≈1 day left')
    expect(
      describeRunway(
        item({ quantityOnHand: 0, quantityAsOf: '2026-06-01' }),
        '2026-06-01',
      ),
    ).toBe('Refill now')
  })
})

describe('not tracked / not estimable', () => {
  it('returns null with no count or anchor', () => {
    expect(daysOfSupplyLeft(item(), '2026-06-01')).toBeNull()
    expect(describeRunway(item(), '2026-06-01')).toBeNull()
    expect(
      daysOfSupplyLeft(item({ quantityOnHand: 30 }), '2026-06-01'),
    ).toBeNull() // no quantityAsOf
  })

  it('returns null when nothing is consumed (no times)', () => {
    const zinc = item({
      times: [],
      quantityOnHand: 30,
      quantityAsOf: '2026-06-01',
    })
    expect(daysOfSupplyLeft(zinc, '2026-06-01')).toBeNull()
  })
})
