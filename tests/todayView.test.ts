// tests/todayView.test.ts — buildTimeSections groups items by time of day and
// now excludes items not due on the given date (per their schedule).
import { describe, expect, it } from 'vitest'
import type { Schedule, StackItem } from '../src/db/db'
import { buildTimeSections } from '../src/lib/todayView'

let nextId = 1
function item(name: string, times: string[], schedule?: Schedule): StackItem {
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
    createdAt: '2026-06-01T08:00:00.000Z',
    updatedAt: '2026-06-01T08:00:00.000Z',
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
