// tests/syncEngine.test.ts — behavior tests for the sync engine against an
// in-memory simulation of the Worker (same semantics: LWW by updatedAt,
// seq cursor, bearer auth). Covers: first-push encryption (no plaintext
// leaves the device), pull-and-apply via the merge engine, tombstone
// propagation, cursor persistence, and both error paths.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { db } from '../src/db/db'
import { addItem } from '../src/db/stackRepository'
import { deriveSyncKeys, encryptRecord } from '../src/lib/crypto'
import { buildExportBundle } from '../src/lib/exportData'
import {
  disableSync,
  enableSync,
  getSyncStatus,
  runSync,
} from '../src/lib/syncEngine'

const ITER = 1000
const PASS = 'test passphrase for sync'

interface ServerRecord {
  uid: string
  cipher: string
  updatedAt: string
  deleted: boolean
  seq: number
}

// Minimal faithful replica of workers/sync semantics.
function makeFakeServer() {
  const records = new Map<string, ServerRecord>()
  let seq = 0
  let rejectAll = false
  let lastSinceSeen = -1

  const fetchImpl = async (_url: unknown, init?: RequestInit) => {
    if (rejectAll)
      return new Response('{"error":"wrong credentials for this sync group"}', {
        status: 403,
      })
    const body = JSON.parse(String(init?.body)) as {
      since: number
      changes: ServerRecord[]
    }
    lastSinceSeen = body.since
    for (const change of body.changes) {
      const existing = records.get(change.uid)
      if (existing && change.updatedAt <= existing.updatedAt) continue
      records.set(change.uid, { ...change, seq: ++seq })
    }
    const out = [...records.values()]
      .filter((r) => r.seq > body.since)
      .sort((a, b) => a.seq - b.seq)
    return new Response(
      JSON.stringify({
        changes: out.map(({ uid, cipher, updatedAt, deleted }) => ({
          uid,
          cipher,
          updatedAt,
          deleted,
        })),
        cursor: out.length > 0 ? out[out.length - 1].seq : body.since,
        more: false,
      }),
      { status: 200 },
    )
  }

  return {
    fetchImpl,
    records,
    get lastSinceSeen() {
      return lastSinceSeen
    },
    set403(value: boolean) {
      rejectAll = value
    },
  }
}

let server: ReturnType<typeof makeFakeServer>

async function clearAll() {
  for (const table of [
    'items',
    'stackEvents',
    'intakes',
    'itemNotes',
    'metrics',
    'metricEntries',
    'dayNotes',
    'tombstones',
    'syncState',
  ])
    await db.table(table).clear()
}

beforeEach(async () => {
  await clearAll()
  server = makeFakeServer()
  vi.stubGlobal('fetch', vi.fn(server.fetchImpl))
})

afterEach(async () => {
  await disableSync()
  vi.unstubAllGlobals()
})

describe('sync engine', () => {
  it('first sync pushes local data as ciphertext only', async () => {
    await addItem({
      name: 'Zinc',
      kind: 'supplement',
      dose: '25 mg',
      times: ['08:00'],
      groups: [],
    })

    await enableSync(PASS, ITER)

    expect(getSyncStatus().state).toBe('idle')
    expect(server.records.size).toBe(2) // item + its 'added' event
    for (const record of server.records.values()) {
      expect(record.cipher).not.toContain('Zinc')
      expect(record.cipher).not.toContain('25 mg')
    }
  })

  it('pulls and applies records from another device', async () => {
    // "phone" encrypts an item with the same passphrase and pushes it
    const phoneKeys = await deriveSyncKeys(PASS, ITER)
    const phoneItem = {
      uid: 'phone-item-uid',
      name: 'Magnesium',
      kind: 'supplement',
      dose: '400 mg',
      times: ['20:00'],
      groups: [],
      status: 'active',
      createdAt: '2026-06-12T08:00:00.000Z',
      updatedAt: '2026-06-12T08:00:00.000Z',
    }
    server.records.set(phoneItem.uid, {
      uid: phoneItem.uid,
      cipher: await encryptRecord(phoneKeys.encKey, {
        table: 'items',
        row: phoneItem,
      }),
      updatedAt: phoneItem.updatedAt,
      deleted: false,
      seq: 1,
    })

    await enableSync(PASS, ITER)

    const items = await db.items.toArray()
    expect(items).toHaveLength(1)
    expect(items[0].name).toBe('Magnesium')
  })

  it('applies tombstones pulled from another device', async () => {
    const itemId = await addItem({
      name: 'Zinc',
      kind: 'supplement',
      dose: '25 mg',
      times: ['08:00'],
      groups: [],
    })
    void itemId
    const localItem = (await db.items.toArray())[0]
    await enableSync(PASS, ITER) // pushes the item

    // phone deletes it (tombstone newer than our updatedAt)
    server.records.set(localItem.uid, {
      uid: localItem.uid,
      cipher: 'AAAA',
      updatedAt: '2099-01-01T00:00:00.000Z',
      deleted: true,
      seq: 99,
    })

    await runSync()

    expect(await db.items.count()).toBe(0)
    expect(await db.tombstones.where('uid').equals(localItem.uid).count()).toBe(
      1,
    )
  })

  it('advances and persists the cursor between rounds', async () => {
    await addItem({
      name: 'Zinc',
      kind: 'supplement',
      dose: '25 mg',
      times: ['08:00'],
      groups: [],
    })
    await enableSync(PASS, ITER)
    const afterFirst = (await db.syncState.toCollection().first())!.cursor
    expect(afterFirst).toBeGreaterThan(0)

    await runSync()
    expect(server.lastSinceSeen).toBe(afterFirst) // second round resumes from cursor
  })

  it('surfaces wrong-passphrase rejection in plain English', async () => {
    server.set403(true)
    await enableSync(PASS, ITER)

    const status = getSyncStatus()
    expect(status.state).toBe('error')
    expect(status.error).toMatch(/passphrase/)
  })

  it('handles being offline without throwing', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.reject(new TypeError('Failed to fetch'))),
    )
    await enableSync(PASS, ITER)

    expect(getSyncStatus().state).toBe('error')
  })

  it('never includes sync credentials in exports', async () => {
    await enableSync(PASS, ITER)
    const state = (await db.syncState.toCollection().first())!

    const bundle = await buildExportBundle()
    const json = JSON.stringify(bundle)

    expect(json).not.toContain(state.groupId)
    expect(json).not.toContain(state.authToken)
    expect(Object.keys(bundle.data)).not.toContain('syncState')
  })
})
