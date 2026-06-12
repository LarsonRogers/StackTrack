// tests/graphView.test.ts — unit tests for the pure graph helpers: range
// math, series building, and the event-collapsing rules (same-day same-group
// merge; solo events keep their own labels).
import { describe, expect, it } from 'vitest'
import type { MetricEntry, StackEvent } from '../src/db/db'
import {
  buildSeries,
  collapseEvents,
  EVENT_COLORS,
  rangeStartDate,
} from '../src/lib/graphView'

const TODAY = new Date(2026, 5, 11) // June 11 2026

function entry(date: string, value: number): MetricEntry {
  return { id: 0, metricId: 1, date, value }
}

let nextItemId = 1

function event(
  date: string,
  type: StackEvent['type'],
  itemName: string,
  group?: string,
  summary = '',
): StackEvent {
  return { id: 0, itemId: nextItemId++, date, type, itemName, group, summary }
}

describe('rangeStartDate', () => {
  it('computes the 30-day lower bound', () => {
    expect(rangeStartDate('30d', TODAY)).toBe('2026-05-12')
  })

  it('returns null for all time', () => {
    expect(rangeStartDate('all', TODAY)).toBeNull()
  })
})

describe('buildSeries', () => {
  it('filters to the range and sorts chronologically', () => {
    const series = buildSeries(
      [entry('2026-06-10', 7), entry('2026-04-01', 5), entry('2026-06-01', 6)],
      '2026-05-12',
    )
    expect(series.map((p) => p.date)).toEqual(['2026-06-01', '2026-06-10'])
    expect(series[0].value).toBe(6)
  })
})

describe('collapseEvents', () => {
  it('merges same-day same-group additions into one labeled marker', () => {
    const markers = collapseEvents(
      [
        event('2026-06-01', 'added', 'Zinc', 'Testosterone Support'),
        event('2026-06-01', 'added', 'Magnesium', 'Testosterone Support'),
        event('2026-06-01', 'added', 'Boron', 'Testosterone Support'),
      ],
      null,
    )
    expect(markers).toHaveLength(1)
    expect(markers[0].label).toBe('Started Testosterone Support (3 items)')
    expect(markers[0].color).toBe(EVENT_COLORS.added)
  })

  it('keeps solo events with per-item labels and colors', () => {
    const markers = collapseEvents(
      [
        event('2026-06-01', 'added', 'Zinc'),
        event(
          '2026-06-02',
          'changed',
          'Zinc',
          undefined,
          'dose: 25 mg → 50 mg',
        ),
        event('2026-06-03', 'removed', 'Zinc'),
      ],
      null,
    )
    expect(markers.map((m) => m.label)).toEqual([
      'Started Zinc',
      'Zinc: dose: 25 mg → 50 mg',
      'Stopped Zinc',
    ])
    expect(markers.map((m) => m.color)).toEqual([
      EVENT_COLORS.added,
      EVENT_COLORS.changed,
      EVENT_COLORS.removed,
    ])
  })

  it('does not merge across dates, types, or groups', () => {
    const markers = collapseEvents(
      [
        event('2026-06-01', 'added', 'Zinc', 'Testosterone Support'),
        event('2026-06-02', 'added', 'Magnesium', 'Testosterone Support'),
        event('2026-06-01', 'removed', 'Boron', 'Testosterone Support'),
        event('2026-06-01', 'added', 'Melatonin', 'Sleep'),
      ],
      null,
    )
    expect(markers).toHaveLength(4)
  })

  it('ungrouped same-day additions stay separate markers', () => {
    const markers = collapseEvents(
      [
        event('2026-06-01', 'added', 'Zinc'),
        event('2026-06-01', 'added', 'Iron'),
      ],
      null,
    )
    expect(markers).toHaveLength(2)
  })

  it('filters events outside the range', () => {
    const markers = collapseEvents(
      [
        event('2026-01-01', 'added', 'Zinc'),
        event('2026-06-01', 'added', 'Iron'),
      ],
      '2026-05-12',
    )
    expect(markers).toHaveLength(1)
    expect(markers[0].label).toBe('Started Iron')
  })
})
