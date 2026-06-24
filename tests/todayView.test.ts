// tests/todayView.test.ts — buildTimeSections groups items by time of day and
// now excludes items not due on the given date (per their schedule).
import { describe, expect, it } from 'vitest'
import type { Schedule, StackItem } from '../src/db/db'
import { buildTimeSections } from '../src/lib/todayView'

let nextId = 1
function item(
  name: string,
  times: string[],
  schedule?: Schedule,
  createdAt = '2026-06-01T08:00:00.000Z',
): StackItem {
  const id = nextId++
  return {
    id,
    uid: `item-${id}`,
    name,
    kind: 'supplement',
    dose: '1',
    times,
    groups: [],
    schedule,
    status: 'active',
    createdAt,
    updatedAt: createdAt,
  }
}

describe('buildTimeSections', () => {
  it('expands every-day items across each of their times', () => {
    const sections = buildTimeSections(
      [item('Zinc', ['08:00', '20:00'])],
      '2026-06-18',
    )
    expect(sections.map((s) => s.time)).toEqual(['08:00', '20:00'])
  })

  it('omits items not due on the date', () => {
    // every-other-day from 2026-06-01: due on 06-03 (offset 2), not 06-02.
    const everyOther: Schedule = {
      kind: 'everyNDays',
      n: 2,
      startDate: '2026-06-01',
    }
    const items = [
      item('Daily', ['08:00']),
      item('EveryOther', ['08:00'], everyOther),
    ]

    const due = buildTimeSections(items, '2026-06-03')
    expect(due[0].entries.map((e) => e.item.name)).toEqual([
      'Daily',
      'EveryOther',
    ])

    const offDay = buildTimeSections(items, '2026-06-02')
    expect(offDay[0].entries.map((e) => e.item.name)).toEqual(['Daily'])
  })
})

describe('within-section sorting (#37)', () => {
  // All at one time so only the within-section order varies.
  const items = [
    item('Banana', ['08:00'], undefined, '2026-06-01T00:00:00.000Z'),
    item('Apple', ['08:00'], undefined, '2026-06-03T00:00:00.000Z'),
    item('Cherry', ['08:00'], undefined, '2026-06-02T00:00:00.000Z'),
  ]

  it('defaults to name A→Z', () => {
    const [section] = buildTimeSections(items, '2026-06-18')
    expect(section.entries.map((e) => e.item.name)).toEqual([
      'Apple',
      'Banana',
      'Cherry',
    ])
  })

  it('sorts name Z→A', () => {
    const [section] = buildTimeSections(items, '2026-06-18', 'nameDesc')
    expect(section.entries.map((e) => e.item.name)).toEqual([
      'Cherry',
      'Banana',
      'Apple',
    ])
  })

  it('sorts recently added first (by createdAt)', () => {
    const [section] = buildTimeSections(items, '2026-06-18', 'added')
    expect(section.entries.map((e) => e.item.name)).toEqual([
      'Apple', // 06-03
      'Cherry', // 06-02
      'Banana', // 06-01
    ])
  })
})

describe('custom drag order (#38b)', () => {
  it('ranks a section by todayOrder[time]; unranked items fall to the end by name', () => {
    const apple = item('Apple', ['08:00'])
    const banana = item('Banana', ['08:00'])
    const cherry = item('Cherry', ['08:00']) // left unranked
    banana.todayOrder = { '08:00': 0 }
    apple.todayOrder = { '08:00': 1 }

    const [section] = buildTimeSections(
      [apple, banana, cherry],
      '2026-06-18',
      'custom',
    )
    expect(section.entries.map((e) => e.item.name)).toEqual([
      'Banana', // rank 0
      'Apple', // rank 1
      'Cherry', // unranked → end
    ])
  })

  it('orders each time section independently for a multi-time item', () => {
    const zinc = item('Zinc', ['08:00', '20:00'])
    const mag = item('Magnesium', ['08:00', '20:00'])
    // Morning: Zinc first; Evening: Magnesium first.
    zinc.todayOrder = { '08:00': 0, '20:00': 1 }
    mag.todayOrder = { '08:00': 1, '20:00': 0 }

    const sections = buildTimeSections([zinc, mag], '2026-06-18', 'custom')
    const morning = sections.find((s) => s.time === '08:00')!
    const evening = sections.find((s) => s.time === '20:00')!
    expect(morning.entries.map((e) => e.item.name)).toEqual([
      'Zinc',
      'Magnesium',
    ])
    expect(evening.entries.map((e) => e.item.name)).toEqual([
      'Magnesium',
      'Zinc',
    ])
  })

  it('all-unranked falls back to a stable name order (no Infinity−Infinity NaN)', () => {
    const banana = item('Banana', ['08:00'])
    const apple = item('Apple', ['08:00'])
    const [section] = buildTimeSections([banana, apple], '2026-06-18', 'custom')
    expect(section.entries.map((e) => e.item.name)).toEqual(['Apple', 'Banana'])
  })
})
