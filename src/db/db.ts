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

// EntityTable marks `id` as auto-incrementing — inserts omit it.
export const db = new Dexie('stacktrack') as Dexie & {
  items: EntityTable<StackItem, 'id'>
  stackEvents: EntityTable<StackEvent, 'id'>
}

// Schema v1. Only indexed fields are listed; other fields are stored as-is.
db.version(1).stores({
  items: '++id, status, group',
  stackEvents: '++id, itemId, date, type',
})
