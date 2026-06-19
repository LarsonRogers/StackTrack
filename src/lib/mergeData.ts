// src/lib/mergeData.ts — merge a StackTrack export from another device into
// this one ("Sync from file"). Never deletes. Match rules:
//   items / metrics / stackEvents / healthEvents — by uid (newest updatedAt
//   wins on conflict)
//   intakes / itemNotes / metricEntries / dayNotes — by uid first, then by
//   natural key (same item+date[+time] created independently on two devices
//   converges to the newest copy instead of duplicating; the local uid is
//   kept so later merges stay stable)
// New records get fresh local auto-increment ids; their numeric references
// (itemId/metricId) are rewired from the uid references — that is what the
// dual id/uid scheme (schema v5) exists for.
// Known limitation (interim file sync): deletions don't propagate — a record
// removed on one device reappears if the other device's file still has it.
// Tombstones arrive with the real sync backend (backlog item 13).
import { db, normalizeGroupsField } from '../db/db'
import type { ExportBundle } from './exportData'

export interface MergeSummary {
  added: number
  updated: number
  unchanged: number
  skipped: number // rows whose parent item/metric could not be resolved
  deleted: number // local records removed by incoming tombstones
}

type AnyRow = Record<string, unknown>

// Merge schema version floor: pre-v5 rows have no uid/updatedAt, so there is
// nothing safe to match on. (Replace-import still accepts old files.)
const MIN_MERGE_SCHEMA = 5

function newerWins(incoming: AnyRow, local: AnyRow): boolean {
  return String(incoming.updatedAt ?? '') > String(local.updatedAt ?? '')
}

// Strips fields the local side owns: its primary key, its uid (for
// natural-key matches), and its numeric reference fields.
const LOCALLY_OWNED_FIELDS = ['id', 'uid', 'itemId', 'metricId']

function payloadOf(row: AnyRow): AnyRow {
  return Object.fromEntries(
    Object.entries(row).filter(([key]) => !LOCALLY_OWNED_FIELDS.includes(key)),
  )
}

// Merges `bundle` into the local database. apply=false computes the summary
// without writing (the UI's pre-confirmation preview); apply=true writes,
// atomically — any failure rolls the whole merge back.
export async function mergeBundle(
  bundle: ExportBundle,
  apply: boolean,
): Promise<MergeSummary> {
  if (bundle.schemaVersion < MIN_MERGE_SCHEMA) {
    throw new Error(
      'That backup is from an older app version and cannot be merged — ' +
        'open StackTrack once on that device to update it and export again ' +
        '(or use "Import backup" to fully replace instead).',
    )
  }

  // Pre-v8 bundles (and pulls from older peers) carry the single `group`
  // field — carry it onto `groups` before any matching/payload work so the
  // merged records land in the current shape.
  for (const row of (bundle.data.items ?? []) as AnyRow[])
    normalizeGroupsField(row)
  for (const row of (bundle.data.stackEvents ?? []) as AnyRow[])
    normalizeGroupsField(row)

  const summary: MergeSummary = {
    added: 0,
    updated: 0,
    unchanged: 0,
    skipped: 0,
    deleted: 0,
  }

  const DATA_TABLES = [
    'items',
    'stackEvents',
    'intakes',
    'itemNotes',
    'metrics',
    'metricEntries',
    'metricNotes',
    'dayNotes',
    'healthEvents',
    'reminders',
    'reminderEvents',
  ] as const

  await db.transaction(
    'rw',
    [
      db.items,
      db.stackEvents,
      db.intakes,
      db.itemNotes,
      db.metrics,
      db.metricEntries,
      db.metricNotes,
      db.dayNotes,
      db.healthEvents,
      db.reminders,
      db.reminderEvents,
      db.tombstones,
    ],
    async () => {
      // --- Tombstones first: union both sides (newest deletedAt per uid),
      // apply incoming deletions to local records, and build the
      // suppression map the record phases consult.
      const localTombstones = await db.tombstones.toArray()
      const deletedAtByUid = new Map<unknown, string>(
        localTombstones.map((t) => [t.uid as unknown, t.deletedAt]),
      )
      for (const incoming of (bundle.data.tombstones ?? []) as AnyRow[]) {
        const known = deletedAtByUid.get(incoming.uid)
        const incomingAt = String(incoming.deletedAt ?? '')
        if (known === undefined || incomingAt > known) {
          deletedAtByUid.set(incoming.uid, incomingAt)
          if (apply) {
            const existing = await db.tombstones
              .where('uid')
              .equals(incoming.uid as string)
              .first()
            if (existing) {
              await db.tombstones.update(existing.id, { deletedAt: incomingAt })
            } else {
              await db.tombstones.add({
                uid: incoming.uid as string,
                deletedAt: incomingAt,
              })
            }
          }
        }
        // delete the matching local record if the tombstone is newer than
        // our last edit to it
        for (const tableName of DATA_TABLES) {
          const row = (await db
            .table(tableName)
            .where('uid')
            .equals(incoming.uid as string)
            .first()) as AnyRow | undefined
          if (row && incomingAt > String(row.updatedAt ?? '')) {
            summary.deleted++
            if (apply) await db.table(tableName).delete(row.id as number)
          }
        }
      }

      // A record edited AFTER its tombstone beats the deletion — the
      // record phases below handle that; this helper tells them whether a
      // tombstone still suppresses an incoming row.
      const suppressedByTombstone = (incoming: AnyRow): boolean => {
        const deletedAt = deletedAtByUid.get(incoming.uid)
        return (
          deletedAt !== undefined &&
          deletedAt > String(incoming.updatedAt ?? '')
        )
      }
      // ...and when a newer record wins, the stale tombstone must go so it
      // cannot re-kill the record in a later merge.
      const clearStaleTombstone = async (incoming: AnyRow) => {
        if (!deletedAtByUid.has(incoming.uid)) return
        deletedAtByUid.delete(incoming.uid)
        if (apply)
          await db.tombstones
            .where('uid')
            .equals(incoming.uid as string)
            .delete()
      }
      // --- Parents: items and metrics, matched by uid ---
      for (const tableName of ['items', 'metrics'] as const) {
        const table = db.table(tableName)
        const localByUid = new Map(
          ((await table.toArray()) as AnyRow[]).map((row) => [row.uid, row]),
        )
        for (const incoming of bundle.data[tableName] as AnyRow[]) {
          if (suppressedByTombstone(incoming)) {
            summary.unchanged++ // deleted here more recently than that copy
            continue
          }
          const local = localByUid.get(incoming.uid)
          if (!local) {
            summary.added++
            await clearStaleTombstone(incoming)
            if (apply) {
              const { id, ...withoutId } = incoming
              void id
              await table.add(withoutId)
            }
          } else if (newerWins(incoming, local)) {
            summary.updated++
            if (apply) await table.put({ ...local, ...payloadOf(incoming) })
          } else {
            summary.unchanged++
          }
        }
      }

      // Full uid → local id maps AFTER the parent merge, for reference rewiring
      const itemIdByUid = new Map(
        (await db.items.toArray()).map((r) => [
          r.uid as unknown,
          r.id as unknown,
        ]),
      )
      const metricIdByUid = new Map(
        (await db.metrics.toArray()).map((r) => [
          r.uid as unknown,
          r.id as unknown,
        ]),
      )

      // --- Dependents ---
      const dependents: {
        tableName:
          | 'stackEvents'
          | 'intakes'
          | 'itemNotes'
          | 'metricEntries'
          | 'metricNotes'
          | 'dayNotes'
          | 'healthEvents'
          | 'reminders'
          | 'reminderEvents'
        refUidField?: 'itemUid' | 'metricUid'
        refIdField?: 'itemId' | 'metricId'
        refMap?: Map<unknown, unknown>
        naturalKey?: (row: AnyRow) => string
      }[] = [
        // append-only history: uid match only
        {
          tableName: 'stackEvents',
          refUidField: 'itemUid',
          refIdField: 'itemId',
          refMap: itemIdByUid,
        },
        {
          tableName: 'intakes',
          refUidField: 'itemUid',
          refIdField: 'itemId',
          refMap: itemIdByUid,
          naturalKey: (r) => `${r.itemUid}|${r.date}|${r.time}`,
        },
        {
          tableName: 'itemNotes',
          refUidField: 'itemUid',
          refIdField: 'itemId',
          refMap: itemIdByUid,
          naturalKey: (r) => `${r.itemUid}|${r.date}`,
        },
        {
          tableName: 'metricEntries',
          refUidField: 'metricUid',
          refIdField: 'metricId',
          refMap: metricIdByUid,
          naturalKey: (r) => `${r.metricUid}|${r.date}`,
        },
        {
          tableName: 'metricNotes',
          refUidField: 'metricUid',
          refIdField: 'metricId',
          refMap: metricIdByUid,
          naturalKey: (r) => `${r.metricUid}|${r.date}`,
        },
        {
          tableName: 'dayNotes',
          naturalKey: (r) => String(r.date),
        },
        // parent-less, no natural key: matched by uid only (a logged event is
        // unique to its device — two identical labels on a day are distinct).
        {
          tableName: 'healthEvents',
        },
        // parent-less, uid-only: reminders carry only itemUid (a label, not a
        // rewired numeric ref), so no parent resolution is needed.
        {
          tableName: 'reminders',
        },
        // parent-less, uid-only: reminderEvents carry only reminderUid (a label,
        // not a rewired numeric ref); append-only history, so uid match suffices.
        {
          tableName: 'reminderEvents',
        },
      ]

      for (const dep of dependents) {
        const table = db.table(dep.tableName)
        const localRows = (await table.toArray()) as AnyRow[]
        const localByUid = new Map(localRows.map((row) => [row.uid, row]))
        const localByKey = dep.naturalKey
          ? new Map(localRows.map((row) => [dep.naturalKey!(row), row]))
          : undefined

        for (const incoming of bundle.data[dep.tableName] as AnyRow[]) {
          if (suppressedByTombstone(incoming)) {
            summary.unchanged++ // deleted here more recently than that copy
            continue
          }
          const local =
            localByUid.get(incoming.uid) ??
            localByKey?.get(dep.naturalKey!(incoming))

          if (local) {
            if (newerWins(incoming, local)) {
              summary.updated++
              // keep local id, uid, and numeric refs — take the payload
              if (apply) await table.put({ ...local, ...payloadOf(incoming) })
            } else {
              summary.unchanged++
            }
            continue
          }

          // new to this device — rewire the numeric parent reference
          let refId: unknown
          if (dep.refUidField) {
            refId = dep.refMap!.get(incoming[dep.refUidField])
            if (refId === undefined) {
              summary.skipped++ // parent unknown — never invent references
              continue
            }
          }
          summary.added++
          await clearStaleTombstone(incoming)
          if (apply) {
            const { id, ...withoutId } = incoming
            void id
            if (dep.refIdField) withoutId[dep.refIdField] = refId
            await table.add(withoutId)
          }
        }
      }
    },
  )

  return summary
}
