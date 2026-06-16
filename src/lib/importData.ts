// src/lib/importData.ts — restore from a StackTrack JSON export.
// Two phases, deliberately separate: parseBundle VALIDATES and touches
// nothing; applyBundle REPLACES all data in one transaction (all-or-nothing
// — a failure mid-import leaves current data exactly as it was).
// The UI is responsible for the confirmation step and the pre-import
// safety snapshot between the two phases.
import { backfillIdentity, db, migrateGroups } from '../db/db'
import type { ExportBundle } from './exportData'

const TABLE_NAMES = [
  'items',
  'stackEvents',
  'intakes',
  'itemNotes',
  'metrics',
  'metricEntries',
  'dayNotes',
  'healthEvents',
  'tombstones',
] as const

// Parses and validates export-file text. Throws plain-English errors
// (shown to the user as-is). Tables missing from older exports default to
// empty — a v3 backup simply has no dayNotes yet.
export function parseBundle(text: string): ExportBundle {
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch {
    throw new Error("That file isn't valid JSON — is it the right file?")
  }

  const bundle = raw as Partial<ExportBundle>
  if (bundle?.app !== 'StackTrack') {
    throw new Error("That file isn't a StackTrack export.")
  }
  if (typeof bundle.schemaVersion !== 'number') {
    throw new Error('That export file is missing its schema version.')
  }
  if (bundle.schemaVersion > db.verno) {
    throw new Error(
      'That backup came from a newer version of StackTrack — update the app first, then import.',
    )
  }
  if (typeof bundle.data !== 'object' || bundle.data === null) {
    throw new Error('That export file has no data section.')
  }

  const data = {} as ExportBundle['data']
  for (const table of TABLE_NAMES) {
    const rows = (bundle.data as Record<string, unknown>)[table] ?? []
    if (!Array.isArray(rows)) {
      throw new Error(`That export file is damaged ("${table}" is not a list).`)
    }
    data[table] = rows
  }

  return {
    app: 'StackTrack',
    exportedAt: String(bundle.exportedAt ?? ''),
    schemaVersion: bundle.schemaVersion,
    data,
  }
}

// Replaces ALL current data with the bundle's, atomically. Row ids are
// preserved so cross-table references (itemId, metricId) stay intact.
export async function applyBundle(bundle: ExportBundle): Promise<void> {
  await db.transaction(
    'rw',
    [
      db.items,
      db.stackEvents,
      db.intakes,
      db.itemNotes,
      db.metrics,
      db.metricEntries,
      db.dayNotes,
      db.healthEvents,
      db.tombstones,
    ],
    async () => {
      for (const table of TABLE_NAMES) {
        await db.table(table).clear()
        // bulkAdd throws on duplicate ids, aborting the whole transaction
        await db.table(table).bulkAdd(bundle.data[table])
      }
      // Pre-v5 backups have no uid/updatedAt — give them sync identity,
      // same backfill the schema upgrade uses (idempotent for v5 bundles).
      await backfillIdentity(db)
      // Pre-v8 backups carry the single `group` field — carry it onto
      // `groups` (same migration the v8 upgrade runs; idempotent for v8+).
      await migrateGroups(db)
    },
  )
}
