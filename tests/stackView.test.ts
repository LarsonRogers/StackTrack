// tests/stackView.test.ts — unit tests for the Stack screen's pure sorting
// and grouping helpers.
import { describe, expect, it } from 'vitest'
import type { StackEvent, StackItem } from '../src/db/db'
import {
  groupByPurpose,
  latestEventDates,
  sortByCustomOrder,
  sortByEarliestTime,
  sortByName,
  sortByRecentlyChanged,
} from '../src/lib/stackView'

let nextId = 1

function item(name: string, times: string[], ...groups: string[]): StackItem {
  const id = nextId++
  return {
    id,
    uid: `item-${id}`,
    name,
    kind: 'supplement',
    dose: '',
    times,
    groups,
    status: 'active',
    createdAt: '',
    updatedAt: '',
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
    const stackEvent = (
      id: number,
      itemId: number,
      date: string,
      type: StackEvent['type'],
      itemName: string,
    ): StackEvent => ({
      id,
      uid: `event-${id}`,
      itemId,
      itemUid: `item-${itemId}`,
      date,
      type,
      itemName,
      groups: [],
      summary: '',
      updatedAt: '',
    })
    const events: StackEvent[] = [
      stackEvent(1, a.id, '2026-06-01', 'added', 'Zinc'),
      stackEvent(2, a.id, '2026-06-10', 'changed', 'Zinc'),
      stackEvent(3, b.id, '2026-06-05', 'added', 'Boron'),
    ]
    const latest = latestEventDates(events)
    expect(latest.get(a.id)).toBe('2026-06-10')

    const sorted = sortByRecentlyChanged([b, a], latest)
    expect(sorted.map((i) => i.name)).toEqual(['Zinc', 'Boron'])
  })
})

describe('sortByCustomOrder', () => {
  const ranked = (name: string, order: number | undefined): StackItem => ({
    ...item(name, []),
    order,
  })

  it('orders by ascending rank', () => {
    const sorted = sortByCustomOrder([
      ranked('Zinc', 2),
      ranked('Boron', 0),
      ranked('Iron', 1),
    ])
    expect(sorted.map((i) => i.name)).toEqual(['Boron', 'Iron', 'Zinc'])
  })

  it('sends unranked items to the end, alphabetical among themselves', () => {
    const sorted = sortByCustomOrder([
      ranked('Zinc', undefined),
      ranked('Boron', 0),
      ranked('Apple', undefined),
    ])
    // ranked first, then the two unranked by name
    expect(sorted.map((i) => i.name)).toEqual(['Boron', 'Apple', 'Zinc'])
  })

  it('is stable for all-unranked items (no Infinity − Infinity NaN)', () => {
    const sorted = sortByCustomOrder([
      ranked('Zinc', undefined),
      ranked('Boron', undefined),
    ])
    expect(sorted.map((i) => i.name)).toEqual(['Boron', 'Zinc'])
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

  it('lists an item in every group it belongs to', () => {
    const sections = groupByPurpose([
      item('Vitamin D', [], 'Bone', 'Immune'),
      item('Calcium', [], 'Bone'),
    ])
    const bone = sections.find((s) => s.group === 'Bone')
    const immune = sections.find((s) => s.group === 'Immune')
    expect(bone?.items.map((i) => i.name)).toEqual(['Calcium', 'Vitamin D'])
    expect(immune?.items.map((i) => i.name)).toEqual(['Vitamin D'])
  })
})
