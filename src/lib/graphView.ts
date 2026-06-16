// src/lib/graphView.ts — pure helpers for the Graphs screen: time-range
// math, metric series building, and collapsing stack events into chart
// markers. No state, no db access. The chart uses a numeric time axis
// (timestamps), so markers can sit on dates with no logged value.
import type {
  EventCategory,
  HealthEvent,
  MetricEntry,
  StackEvent,
  StackEventType,
} from '../db/db'
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

// Distinct line colors for the components of a composite metric. Cycles if a
// metric somehow has more parts than colors (no practical limit on parts).
export const COMPONENT_COLORS = [
  '#0f766e', // teal (matches the single-metric line)
  '#b45309', // amber
  '#7c3aed', // violet
  '#be123c', // rose
  '#0369a1', // blue
  '#4d7c0f', // green
]

export interface CompositePoint {
  ts: number
  date: string
  values: number[] // one per component, in component order
}

// Chronological points for a composite metric — each point carries every
// component's value, so the chart draws one line per component. Entries
// without a `values` array (other kinds) are skipped.
export function buildCompositeSeries(
  entries: MetricEntry[],
  startDate: string | null,
): CompositePoint[] {
  return entries
    .filter((entry) => startDate === null || entry.date >= startDate)
    .filter((entry) => Array.isArray(entry.values))
    .toSorted((a, b) => a.date.localeCompare(b.date))
    .map((entry) => ({
      ts: dateToTs(entry.date),
      date: entry.date,
      values: entry.values!,
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

  // Bucket key: date + type + group. An event in several groups lands in each
  // group's bucket. Ungrouped items never merge — each gets a per-item key.
  const buckets = new Map<string, { group: string; events: StackEvent[] }>()
  const add = (key: string, group: string, event: StackEvent) => {
    const bucket = buckets.get(key) ?? { group, events: [] }
    bucket.events.push(event)
    buckets.set(key, bucket)
  }
  for (const event of inRange) {
    if (event.groups.length > 0) {
      for (const group of event.groups)
        add(`${event.date}|${event.type}|${group}`, group, event)
    } else {
      add(`${event.date}|${event.type}|item:${event.itemId}`, '', event)
    }
  }

  const markers: ChangeMarker[] = []
  for (const { group, events } of buckets.values()) {
    const { date, type } = events[0]
    let label: string
    if (events.length === 1) {
      label = eventLabel(events[0])
    } else if (type === 'added') {
      label = `Started ${group} (${events.length} items)`
    } else if (type === 'removed') {
      label = `Stopped ${group} (${events.length} items)`
    } else {
      label = `${group}: ${events.length} changes`
    }
    markers.push({
      ts: dateToTs(date),
      date,
      type,
      label,
      color: EVENT_COLORS[type],
    })
  }

  // A solo event for a multi-group item lands in several buckets and yields
  // the same per-item marker each time — collapse those duplicates.
  const seen = new Set<string>()
  const unique = markers.filter((marker) => {
    const key = `${marker.date}|${marker.type}|${marker.label}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  return unique.toSorted(
    (a, b) => a.date.localeCompare(b.date) || a.label.localeCompare(b.label),
  )
}

// Health-event marker palette — distinct hues from the stack EVENT_COLORS
// (green/amber/red) so user-logged events read as a separate layer.
export const EVENT_CATEGORY_COLORS: Record<EventCategory, string> = {
  symptom: '#e11d48', // rose
  appointment: '#2563eb', // blue
  procedure: '#7c3aed', // violet
  other: '#475569', // slate
}

export interface EventMarker {
  ts: number
  date: string
  category: EventCategory
  label: string
  color: string
}

// Turns logged health events in range into chart markers, one per event
// (events are not collapsed — each is a distinct moment). Color by category.
export function buildEventMarkers(
  events: HealthEvent[],
  startDate: string | null,
): EventMarker[] {
  return events
    .filter((event) => startDate === null || event.date >= startDate)
    .toSorted(
      (a, b) => a.date.localeCompare(b.date) || a.label.localeCompare(b.label),
    )
    .map((event) => ({
      ts: dateToTs(event.date),
      date: event.date,
      category: event.category,
      label: event.label,
      color: EVENT_CATEGORY_COLORS[event.category],
    }))
}
