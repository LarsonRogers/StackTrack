// tests/stackView.test.ts — unit tests for the Stack screen's pure sorting
// and grouping helpers.
import { describe, expect, it } from 'vitest'
import type { StackEvent, StackItem } from '../src/db/db'
import {
  groupByPurpose,
  latestEventDates,
  sortByEarliestTime,
  sortByName,
  sortByRecentlyChanged,
} from '../src/lib/stackView'

let nextId = 1

function item(name: string, times: string[], group?: string): StackItem {
  return {
    id: nextId++,
    name,
    kind: 'supplement',
    dose: '',
    times,
    group,
    status: 'active',
    createdAt: '',
  }
}

describe('sortByName', () => {
  it('orders alphabetically', () => {
    const sorted = sortByName([item('Zinc', []), item('Boron', [])])
    expect(sorted.map((i) => i.name)).toEqual(['Boron', 'Zinc'])
  })
})

describe('sortByEarliestTime', () => {
  it('orders by earliest scheduled time, name breaking ties', () => {
    const sorted = sortByEarliestTime([
      item('Zinc', ['20:00']),
      item('Melatonin', ['21:00']),
      item('Vitamin D', ['08:00', '20:00']),
      item('Creatine', ['08:00']),
    ])
    expect(sorted.map((i) => i.name)).toEqual([
      'Creatine', // 08:00, ties with Vitamin D, C < V
      'Vitamin D',
      'Zinc',
      'Melatonin',
    ])
  })
})

describe('latestEventDates / sortByRecentlyChanged', () => {
  it('keeps the newest event date per item and sorts newest first', () => {
    const a = item('Zinc', [])
    const b = item('Boron', [])
    const events: StackEvent[] = [
      {
        id: 1,
        itemId: a.id,
        date: '2026-06-01',
        type: 'added',
        itemName: 'Zinc',
        summary: '',
      },
      {
        id: 2,
        itemId: a.id,
        date: '2026-06-10',
        type: 'changed',
        itemName: 'Zinc',
        summary: '',
      },
      {
        id: 3,
        itemId: b.id,
        date: '2026-06-05',
        type: 'added',
        itemName: 'Boron',
        summary: '',
      },
    ]
    const latest = latestEventDates(events)
    expect(latest.get(a.id)).toBe('2026-06-10')

    const sorted = sortByRecentlyChanged([b, a], latest)
    expect(sorted.map((i) => i.name)).toEqual(['Zinc', 'Boron'])
  })
})

describe('groupByPurpose', () => {
  it('sections alphabetically with ungrouped last', () => {
    const sections = groupByPurpose([
      item('Zinc', [], 'Testosterone Support'),
      item('Melatonin', [], 'Sleep'),
      item('Vitamin C', []),
    ])
    expect(sections.map((s) => s.group)).toEqual([
      'Sleep',
      'Testosterone Support',
      null,
    ])
  })
})
