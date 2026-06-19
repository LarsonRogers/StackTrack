// src/lib/syncEngine.ts — the E2E sync engine. One round of sync:
//   1. gather everything changed locally since the last push watermark
//   2. encrypt each record on-device (lib/crypto) and POST to the Worker
//   3. decrypt what came back and apply it through the SAME merge engine
//      the file-sync feature uses (lib/mergeData) — uid matching,
//      newest-wins, natural-key convergence, tombstones
// The server only ever sees ciphertext. Status changes are published to
// subscribers (the Sync screen). Re-entrant calls coalesce.
import { db, type SyncState } from '../db/db'
import {
  deriveSyncKeys,
  encryptRecord,
  decryptRecord,
  importEncKey,
} from './crypto'
import { mergeBundle } from './mergeData'
import type { ExportBundle } from './exportData'
import { nowIso } from './identity'

// The production sync endpoint (workers/sync). Override via Vite env for
// local worker development; same endpoint in dev/prod otherwise — the
// group passphrase, not the environment, separates data.
const SYNC_URL =
  import.meta.env?.VITE_SYNC_URL ??
  'https://stacktrack-sync.el-m-rogers.workers.dev/v1/sync'

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

export interface SyncStatus {
  state: 'disabled' | 'idle' | 'syncing' | 'error'
  lastSyncedAt?: string
  error?: string
}

type AnyRow = Record<string, unknown>

// --- status pub/sub (tiny, no dependency) ---
let currentStatus: SyncStatus = { state: 'disabled' }
const listeners = new Set<(status: SyncStatus) => void>()

function setStatus(status: SyncStatus) {
  currentStatus = status
  for (const listener of listeners) listener(status)
}

export function getSyncStatus(): SyncStatus {
  return currentStatus
}

export function onSyncStatus(
  listener: (status: SyncStatus) => void,
): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

// --- lifecycle ---

export async function loadSyncState(): Promise<SyncState | undefined> {
  return db.syncState.toCollection().first()
}

// Derives keys from the passphrase (slow on purpose — brute-force
// protection), stores them, and runs the first sync. `iterations` is
// overridable only for tests.
export async function enableSync(
  passphrase: string,
  iterations?: number,
): Promise<void> {
  const keys = await deriveSyncKeys(passphrase, iterations)
  await db.syncState.clear()
  await db.syncState.add({
    groupId: keys.groupId,
    authToken: keys.authToken,
    encKeyHex: keys.encKeyHex,
    cursor: 0,
  } as SyncState)
  setStatus({ state: 'idle' })
  await runSync()
}

// Forgets the credentials on THIS device. Local data stays; the sync
// group (and other devices) are unaffected.
export async function disableSync(): Promise<void> {
  await db.syncState.clear()
  setStatus({ state: 'disabled' })
}

// --- the sync round ---

let syncing = false
let pendingRerun = false

export async function runSync(): Promise<void> {
  if (syncing) {
    pendingRerun = true // a write happened mid-sync — run once more after
    return
  }
  const state = await loadSyncState()
  if (!state) return

  syncing = true
  setStatus({ state: 'syncing', lastSyncedAt: state.lastSyncedAt })
  try {
    const encKey = await importEncKey(state.encKeyHex)
    const syncStartedAt = nowIso()

    // 1. gather + encrypt local changes since the watermark
    const changes: AnyRow[] = []
    for (const tableName of DATA_TABLES) {
      const rows = (await db.table(tableName).toArray()) as AnyRow[]
      for (const row of rows) {
        if (state.lastPushedAt && String(row.updatedAt) <= state.lastPushedAt)
          continue
        const { id, ...payload } = row
        void id
        changes.push({
          uid: row.uid,
          cipher: await encryptRecord(encKey, {
            table: tableName,
            row: payload,
          }),
          updatedAt: row.updatedAt,
          deleted: false,
        })
      }
    }
    const tombstones = await db.tombstones.toArray()
    for (const tombstone of tombstones) {
      if (state.lastPushedAt && tombstone.deletedAt <= state.lastPushedAt)
        continue
      changes.push({
        uid: tombstone.uid,
        cipher: await encryptRecord(encKey, { table: 'tombstones' }),
        updatedAt: tombstone.deletedAt,
        deleted: true,
      })
    }

    // 2./3. exchange with the server, applying pulls until drained.
    // Our own pushed records echo back — the merge treats them as
    // unchanged, so that is just a little wasted decryption, not a bug.
    let cursor = state.cursor
    let outgoing = changes
    let more = true
    while (more) {
      const response = await fetch(SYNC_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${state.authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          groupId: state.groupId,
          since: cursor,
          changes: outgoing,
        }),
      })
      outgoing = [] // pushed once; later loop turns only pull
      if (response.status === 403) {
        throw new Error(
          'The server rejected this passphrase — it does not match the sync group it maps to. Disconnect and re-enter the passphrase.',
        )
      }
      if (!response.ok) {
        throw new Error(
          `Sync server error (${response.status}) — will retry later.`,
        )
      }
      const body = (await response.json()) as {
        changes: {
          uid: string
          cipher: string
          updatedAt: string
          deleted: boolean
        }[]
        cursor: number
        more: boolean
      }

      const bundle = emptyBundle()
      for (const change of body.changes) {
        if (change.deleted) {
          bundle.data.tombstones.push({
            uid: change.uid,
            deletedAt: change.updatedAt,
          })
          continue
        }
        let payload: { table?: string; row?: AnyRow }
        try {
          payload = (await decryptRecord(encKey, change.cipher)) as {
            table?: string
            row?: AnyRow
          }
        } catch {
          // Undecryptable record (e.g. written under a different passphrase
          // that maps to the same group — practically impossible, or a
          // corrupted row). Skip rather than fail the whole sync.
          continue
        }
        if (
          payload.table &&
          payload.row &&
          (DATA_TABLES as readonly string[]).includes(payload.table)
        ) {
          bundle.data[payload.table as (typeof DATA_TABLES)[number]].push(
            payload.row,
          )
        }
      }
      await mergeBundle(bundle, true)
      cursor = body.cursor
      more = body.more
    }

    // persist progress
    const finishedAt = nowIso()
    await db.syncState.update(state.id, {
      cursor,
      lastPushedAt: syncStartedAt,
      lastSyncedAt: finishedAt,
    })
    setStatus({ state: 'idle', lastSyncedAt: finishedAt })
  } catch (error) {
    setStatus({
      state: 'error',
      lastSyncedAt: state.lastSyncedAt,
      error:
        error instanceof Error
          ? error.message
          : 'Sync failed — will retry later.',
    })
  } finally {
    syncing = false
    if (pendingRerun) {
      pendingRerun = false
      void runSync()
    }
  }
}

function emptyBundle(): ExportBundle {
  return {
    app: 'StackTrack',
    exportedAt: nowIso(),
    schemaVersion: db.verno,
    data: {
      items: [],
      stackEvents: [],
      intakes: [],
      itemNotes: [],
      metrics: [],
      metricEntries: [],
      metricNotes: [],
      dayNotes: [],
      healthEvents: [],
      reminders: [],
      reminderEvents: [],
      tombstones: [],
    },
  }
}

// --- triggers: app open, tab return, and shortly after local writes ---

const WRITE_DEBOUNCE_MS = 8000
let debounceTimer: ReturnType<typeof setTimeout> | undefined

function scheduleSyncSoon() {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => void runSync(), WRITE_DEBOUNCE_MS)
}

// Installed once at app start. Dexie table hooks fire on every write —
// syncState itself is excluded or the engine would trigger itself.
export async function initSyncTriggers(): Promise<void> {
  for (const tableName of [...DATA_TABLES, 'tombstones']) {
    const table = db.table(tableName)
    table.hook('creating', () => {
      scheduleSyncSoon()
    })
    table.hook('updating', () => {
      scheduleSyncSoon()
    })
    table.hook('deleting', () => {
      scheduleSyncSoon()
    })
  }
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') void runSync()
  })
  const state = await loadSyncState()
  if (state) {
    setStatus({ state: 'idle', lastSyncedAt: state.lastSyncedAt })
    void runSync() // sync on open
  }
}
