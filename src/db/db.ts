// src/db/db.ts — the StackTrack database (IndexedDB via Dexie) and its record
// types. Owns the schema only. All WRITES go through stackRepository.ts —
// never call db.items.add/put/delete from UI code (key invariant: every stack
// change records a StackEvent).
import Dexie, { type EntityTable } from 'dexie'

export type ItemKind = 'med' | 'supplement'
export type ItemStatus = 'active' | 'archived'

// One medication or supplement in the user's stack.
export interface StackItem {
  id: number
  name: string
  kind: ItemKind
  dose: string // free text, e.g. "500 mg" — no parsing, no dosage logic (out of scope, permanently)
  times: string[] // scheduled times of day as 'HH:mm', sorted, unique
  group?: string // purpose group, e.g. "Testosterone Support"
  status: ItemStatus // archived items are hidden, never deleted — history must survive
  createdAt: string // ISO datetime
}

export type StackEventType = 'added' | 'changed' | 'removed'

// One dated change to the stack — the source of the graph markers (backlog
// item 6). itemName/group are snapshots taken at event time so history stays
// accurate if the item is later renamed or regrouped.
export interface StackEvent {
  id: number
  itemId: number
  date: string // local calendar date 'YYYY-MM-DD' — markers are per-day
  type: StackEventType
  itemName: string
  group?: string
  summary: string // human-readable, e.g. "dose: 25 mg → 50 mg"
}

// One item taken at one scheduled time on one date. Marking intake is NOT a
// stack event — taking a pill is not a stack change and gets no graph marker.
export interface IntakeRecord {
  id: number
  itemId: number
  date: string // local calendar date 'YYYY-MM-DD'
  time: string // the scheduled slot this checks off, 'HH:mm'
  takenAt: string // ISO datetime of the actual tap
}

// A short note attached to one item for one day, e.g. "ran out of pills".
// At most one per (itemId, date) — enforced by itemNoteRepository.
export interface ItemNote {
  id: number
  itemId: number
  date: string // local calendar date 'YYYY-MM-DD'
  text: string
}

export type MetricKind = 'rating' | 'number'

// A user-defined daily metric, e.g. "Energy" (1–10 rating) or "Weight"
// (free number with unit). Max 10 active — enforced by metricRepository.
// kind is fixed after creation: changing it would corrupt logged history.
export interface Metric {
  id: number
  name: string
  kind: MetricKind
  unit?: string // display label for 'number' metrics, e.g. "kg", "hours"
  status: ItemStatus // archived metrics keep their entries — never deleted
  createdAt: string
}

// One logged value for one metric on one day. At most one per
// (metricId, date) — re-logging replaces (enforced by metricEntryRepository).
export interface MetricEntry {
  id: number
  metricId: number
  date: string // local calendar date 'YYYY-MM-DD'
  value: number // rating metrics: integer 1–10; number metrics: any finite number
}

// EntityTable marks `id` as auto-incrementing — inserts omit it.
export const db = new Dexie('stacktrack') as Dexie & {
  items: EntityTable<StackItem, 'id'>
  stackEvents: EntityTable<StackEvent, 'id'>
  intakes: EntityTable<IntakeRecord, 'id'>
  itemNotes: EntityTable<ItemNote, 'id'>
  metrics: EntityTable<Metric, 'id'>
  metricEntries: EntityTable<MetricEntry, 'id'>
}

// Schema v1. Only indexed fields are listed; other fields are stored as-is.
db.version(1).stores({
  items: '++id, status, group',
  stackEvents: '++id, itemId, date, type',
})

// Schema v2 (additive): daily tracking tables. Unchanged tables carry over.
db.version(2).stores({
  intakes: '++id, date, [itemId+date]',
  itemNotes: '++id, date, [itemId+date]',
})

// Schema v3 (additive): custom metrics — definitions and daily values.
db.version(3).stores({
  metrics: '++id, status',
  metricEntries: '++id, date, [metricId+date]',
})
