// src/db/db.ts — the StackTrack database (IndexedDB via Dexie) and its record
// types. Owns the schema only. All WRITES go through stackRepository.ts —
// never call db.items.add/put/delete from UI code (key invariant: every stack
// change records a StackEvent).
//
// Sync identity (schema v5): every record carries a device-independent `uid`
// and an `updatedAt` stamp; cross-table references exist in two forms — the
// local auto-increment id (fast queries, legacy) and the uid (merge-safe
// across devices). New writes set both; v5's upgrade backfills old data.
import Dexie, { type EntityTable } from 'dexie'
import { newUid, nowIso } from '../lib/identity'

export type ItemKind = 'med' | 'supplement'
export type ItemStatus = 'active' | 'archived'

// One medication or supplement in the user's stack.
export interface StackItem {
  id: number
  uid: string // device-independent identity (sync)
  name: string
  kind: ItemKind
  dose: string // free text, e.g. "500 mg" — no parsing, no dosage logic (out of scope, permanently)
  times: string[] // scheduled times of day as 'HH:mm', sorted, unique
  group?: string // purpose group, e.g. "Testosterone Support"
  status: ItemStatus // archived items are hidden, never deleted — history must survive
  createdAt: string // ISO datetime
  updatedAt: string // ISO datetime of last change (merge: newest wins)
}

export type StackEventType = 'added' | 'changed' | 'removed'

// One dated change to the stack — the source of the graph markers (backlog
// item 6). itemName/group are snapshots taken at event time so history stays
// accurate if the item is later renamed or regrouped.
export interface StackEvent {
  id: number
  uid: string
  itemId: number
  itemUid: string // merge-safe reference to the item
  date: string // local calendar date 'YYYY-MM-DD' — markers are per-day
  type: StackEventType
  itemName: string
  group?: string
  summary: string // human-readable, e.g. "dose: 25 mg → 50 mg"
  updatedAt: string
}

// One item taken at one scheduled time on one date. Marking intake is NOT a
// stack event — taking a pill is not a stack change and gets no graph marker.
export interface IntakeRecord {
  id: number
  uid: string
  itemId: number
  itemUid: string
  date: string // local calendar date 'YYYY-MM-DD'
  time: string // the scheduled slot this checks off, 'HH:mm'
  takenAt: string // ISO datetime of the actual tap
  updatedAt: string
}

// A short note attached to one item for one day, e.g. "ran out of pills".
// At most one per (itemId, date) — enforced by itemNoteRepository.
export interface ItemNote {
  id: number
  uid: string
  itemId: number
  itemUid: string
  date: string // local calendar date 'YYYY-MM-DD'
  text: string
  updatedAt: string
}

export type MetricKind = 'rating' | 'number'

// A user-defined daily metric, e.g. "Energy" (1–10 rating) or "Weight"
// (free number with unit). No cap on count (user decision 2026-06-11).
// kind is fixed after creation: changing it would corrupt logged history.
export interface Metric {
  id: number
  uid: string
  name: string
  kind: MetricKind
  unit?: string // display label for 'number' metrics, e.g. "kg", "hours"
  status: ItemStatus // archived metrics keep their entries — never deleted
  createdAt: string
  updatedAt: string
}

// One logged value for one metric on one day. At most one per
// (metricId, date) — re-logging replaces (enforced by metricEntryRepository).
export interface MetricEntry {
  id: number
  uid: string
  metricId: number
  metricUid: string
  date: string // local calendar date 'YYYY-MM-DD'
  value: number // rating metrics: integer 1–10; number metrics: any finite number
  updatedAt: string
}

// The day-level journal: one free-text note per calendar date, about the
// day as a whole (per-item context belongs in ItemNote instead).
export interface DayNote {
  id: number
  uid: string
  date: string // local calendar date 'YYYY-MM-DD'
  text: string
  updatedAt: string
}

// A deletion marker: "the record with this uid was removed at this time."
// Lets deletions propagate through sync/merge instead of silently
// resurrecting (items/metrics archive rather than delete, so tombstones
// come from intakes, notes, values, and journal entries).
export interface Tombstone {
  id: number
  uid: string // uid of the deleted record
  deletedAt: string // ISO datetime — compared against updatedAt (newer wins)
}

// EntityTable marks `id` as auto-incrementing — inserts omit it.
export const db = new Dexie('stacktrack') as Dexie & {
  items: EntityTable<StackItem, 'id'>
  stackEvents: EntityTable<StackEvent, 'id'>
  intakes: EntityTable<IntakeRecord, 'id'>
  itemNotes: EntityTable<ItemNote, 'id'>
  metrics: EntityTable<Metric, 'id'>
  metricEntries: EntityTable<MetricEntry, 'id'>
  dayNotes: EntityTable<DayNote, 'id'>
  tombstones: EntityTable<Tombstone, 'id'>
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

// Schema v4 (additive): day-level journal notes. date is unique per row
// by construction (dayNoteRepository upserts on it).
db.version(4).stores({
  dayNotes: '++id, date',
})

// Schema v5 (additive): sync identity — unique `uid` index on every table
// (&uid). Existing rows lack uid until the upgrade backfill runs; IndexedDB
// ignores undefined values in unique indexes, so the constraint only bites
// once uids exist.
db.version(5)
  .stores({
    items: '++id, &uid, status, group',
    stackEvents: '++id, &uid, itemId, date, type',
    intakes: '++id, &uid, date, [itemId+date]',
    itemNotes: '++id, &uid, date, [itemId+date]',
    metrics: '++id, &uid, status',
    metricEntries: '++id, &uid, date, [metricId+date]',
    dayNotes: '++id, &uid, date',
  })
  .upgrade((tx) => backfillIdentity(tx))

// Schema v6 (additive): deletion tombstones — an empty new table; no
// data migration.
db.version(6).stores({
  tombstones: '++id, &uid',
})

// Minimal table access shared by the live db, a transaction zone, and the
// v5 upgrade transaction — lets one backfill serve all callers.
interface TableHost {
  table(name: string): {
    toArray(): Promise<unknown[]>
    bulkPut(rows: unknown[]): Promise<unknown>
  }
}

type AnyRow = Record<string, unknown>

// Fills uid/updatedAt on every row that lacks them and wires uid-based
// references (itemUid/metricUid) from the legacy numeric ids. Used by the
// v5 schema upgrade AND by import of pre-v5 backup files. Idempotent.
export async function backfillIdentity(host: TableHost): Promise<void> {
  const stamp = nowIso()

  // Parents first — dependents need their uids for reference wiring.
  const parentUids = new Map<string, Map<unknown, string>>()
  for (const tableName of ['items', 'metrics']) {
    const rows = (await host.table(tableName).toArray()) as AnyRow[]
    const uidById = new Map<unknown, string>()
    const changed: AnyRow[] = []
    for (const row of rows) {
      const before = { ...row }
      row.uid ??= newUid()
      row.updatedAt ??= row.createdAt ?? stamp
      uidById.set(row.id, row.uid as string)
      if (before.uid !== row.uid || before.updatedAt !== row.updatedAt)
        changed.push(row)
    }
    if (changed.length > 0) await host.table(tableName).bulkPut(changed)
    parentUids.set(tableName, uidById)
  }

  const itemUids = parentUids.get('items')!
  const metricUids = parentUids.get('metrics')!
  const dependents: {
    tableName: string
    refField?: string
    refSource?: Map<unknown, string>
    updatedFrom?: string // copy this field into updatedAt when present
  }[] = [
    { tableName: 'stackEvents', refField: 'itemUid', refSource: itemUids },
    {
      tableName: 'intakes',
      refField: 'itemUid',
      refSource: itemUids,
      updatedFrom: 'takenAt',
    },
    { tableName: 'itemNotes', refField: 'itemUid', refSource: itemUids },
    {
      tableName: 'metricEntries',
      refField: 'metricUid',
      refSource: metricUids,
    },
    { tableName: 'dayNotes' },
  ]

  for (const { tableName, refField, refSource, updatedFrom } of dependents) {
    const rows = (await host.table(tableName).toArray()) as AnyRow[]
    const changed: AnyRow[] = []
    for (const row of rows) {
      const before = { ...row }
      row.uid ??= newUid()
      row.updatedAt ??= (updatedFrom && row[updatedFrom]) || stamp
      if (refField && refSource && row[refField] === undefined) {
        const refId = refField === 'metricUid' ? row.metricId : row.itemId
        const refUid = refSource.get(refId)
        if (refUid) row[refField] = refUid
      }
      if (
        before.uid !== row.uid ||
        before.updatedAt !== row.updatedAt ||
        (refField && before[refField] !== row[refField])
      )
        changed.push(row)
    }
    if (changed.length > 0) await host.table(tableName).bulkPut(changed)
  }
}
