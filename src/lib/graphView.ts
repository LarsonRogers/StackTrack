// src/lib/graphView.ts — pure helpers for the Graphs screen: time-range
// math, metric series building, and collapsing stack events into chart
// markers. No state, no db access. The chart uses a numeric time axis
// (timestamps), so markers can sit on dates with no logged value.
import type { MetricEntry, StackEvent, StackEventType } from '../db/db'
import { toIsoDate } from './dates'

export type GraphRange = '30d' | '90d' | 'all'

export const RANGE_LABELS: Record<GraphRange, string> = {
  '30d': '30 days',
  '90d': '90 days',
  all: 'All time',
}

// Marker palette — keep in sync with the legend dots in index.css usage.
export const EVENT_COLORS: Record<StackEventType, string> = {
  added: '#16a34a', // green — something started
  changed: '#d97706', // amber — something adjusted
  removed: '#dc2626', // red — something stopped
}

// Parses 'YYYY-MM-DD' to a local-noon timestamp. Noon, not midnight, so the
// point stays on the right calendar day across DST shifts.
export function dateToTs(date: string): number {
  const [year, month, day] = date.split('-').map(Number)
  return new Date(year, month - 1, day, 12).getTime()
}

// First date inside the range, or null for 'all' (no lower bound).
export function rangeStartDate(range: GraphRange, today: Date): string | null {
  if (range === 'all') return null
  const days = range === '30d' ? 30 : 90
  const start = new Date(today)
  start.setDate(start.getDate() - days)
  return toIsoDate(start)
}

export interface SeriesPoint {
  ts: number
  date: string
  value: number
}

// Chronological points for one metric within the range. Days without a
// logged value simply have no point — the line connects across them.
export function buildSeries(
  entries: MetricEntry[],
  startDate: string | null,
): SeriesPoint[] {
  return entries
    .filter((entry) => startDate === null || entry.date >= startDate)
    .toSorted((a, b) => a.date.localeCompare(b.date))
    .map((entry) => ({
      ts: dateToTs(entry.date),
      date: entry.date,
      value: entry.value,
    }))
}

export interface ChangeMarker {
  ts: number
  date: string
  type: StackEventType
  label: string
  color: string
}

// Human verb per event type, used for solo and group labels alike.
function eventLabel(event: StackEvent): string {
  switch (event.type) {
    case 'added':
      return `Started ${event.itemName}`
    case 'removed':
      return `Stopped ${event.itemName}`
    case 'changed':
      return `${event.itemName}: ${event.summary}`
  }
}

// Collapses stack events in range into chart markers. Same-day events of
// the same type in the same group merge into one marker ("Started
// Testosterone Support (3 items)") — per-item events stay the ground truth;
// this is display-time grouping only. Solo events keep their own label.
export function collapseEvents(
  events: StackEvent[],
  startDate: string | null,
): ChangeMarker[] {
  const inRange = events.filter(
    (event) => startDate === null || event.date >= startDate,
  )

  // Group key: date + type + group. Ungrouped items never merge — each gets
  // a per-item key.
  const buckets = new Map<string, StackEvent[]>()
  for (const event of inRange) {
    const key = event.group
      ? `${event.date}|${event.type}|${event.group}`
      : `${event.date}|${event.type}|item:${event.itemId}`
    const bucket = buckets.get(key) ?? []
    bucket.push(event)
    buckets.set(key, bucket)
  }

  const markers: ChangeMarker[] = []
  for (const bucket of buckets.values()) {
    const { date, type, group } = bucket[0]
    let label: string
    if (bucket.length === 1) {
      label = eventLabel(bucket[0])
    } else if (type === 'added') {
      label = `Started ${group} (${bucket.length} items)`
    } else if (type === 'removed') {
      label = `Stopped ${group} (${bucket.length} items)`
    } else {
      label = `${group}: ${bucket.length} changes`
    }
    markers.push({
      ts: dateToTs(date),
      date,
      type,
      label,
      color: EVENT_COLORS[type],
    })
  }

  return markers.toSorted(
    (a, b) => a.date.localeCompare(b.date) || a.label.localeCompare(b.label),
  )
}
