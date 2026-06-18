// tests/syncIdentity.test.ts — behavior tests for the sync-identity
// foundation (schema v5): every repository write carries uid + updatedAt +
// uid-based references, the backfill upgrades legacy rows correctly, and
// pre-v5 backup files import with identity added.
import { beforeEach, describe, expect, it } from 'vitest'
import { backfillIdentity, db } from '../src/db/db'
import { addItem, updateItem } from '../src/db/stackRepository'
import { markTaken } from '../src/db/intakeRepository'
import { setItemNote } from '../src/db/itemNoteRepository'
import { addMetric } from '../src/db/metricRepository'
import { setMetricEntry } from '../src/db/metricEntryRepository'
import { setDayNote } from '../src/db/dayNoteRepository'
import { applyBundle, parseBundle } from '../src/lib/importData'

const TODAY = '2026-06-12'

async function clearAll() {
  await db.items.clear()
  await db.stackEvents.clear()
  await db.intakes.clear()
  await db.itemNotes.clear()
  await db.metrics.clear()
  await db.metricEntries.clear()
  await db.metricNotes.clear()
  await db.dayNotes.clear()
}

beforeEach(clearAll)

describe('repositories write sync identity', () => {
  it('gives new records uid, updatedAt, and uid references', async () => {
    const itemId = await addItem({
      name: 'Zinc',
      kind: 'supplement',
      dose: '25 mg',
      times: ['08:00'],
      groups: [],
    })
    await markTaken(itemId, TODAY, '08:00')
    await setItemNote(itemId, TODAY, 'ran low')
    const metricId = await addMetric({ name: 'Energy', kind: 'rating' })
    await setMetricEntry(metricId, TODAY, 7)
    await setDayNote(TODAY, 'fine day')

    const item = (await db.items.toArray())[0]
    const event = (await db.stackEvents.toArray())[0]
    const intake = (await db.intakes.toArray())[0]
    const note = (await db.itemNotes.toArray())[0]
    const metric = (await db.metrics.toArray())[0]
    const entry = (await db.metricEntries.toArray())[0]
    const dayNote = (await db.dayNotes.toArray())[0]

    for (const record of [item, event, intake, note, metric, entry, dayNote]) {
      expect(record.uid).toMatch(/[0-9a-f-]{36}/)
      expect(record.updatedAt).toBeTruthy()
    }
    expect(event.itemUid).toBe(item.uid)
    expect(intake.itemUid).toBe(item.uid)
    expect(note.itemUid).toBe(item.uid)
    expect(entry.metricUid).toBe(metric.uid)
  })

  it('keeps uid stable but refreshes updatedAt on edit', async () => {
    const id = await addItem({
      name: 'Zinc',
      kind: 'supplement',
      dose: '25 mg',
      times: ['08:00'],
      groups: [],
    })
    const before = (await db.items.toArray())[0]
    await new Promise((resolve) => setTimeout(resolve, 5))
    await updateItem(id, {
      name: 'Zinc',
      kind: 'supplement',
      dose: '50 mg',
      times: ['08:00'],
      groups: [],
    })
    const after = (await db.items.toArray())[0]

    expect(after.uid).toBe(before.uid)
    expect(after.updatedAt > before.updatedAt).toBe(true)
  })
})

describe('backfillIdentity', () => {
  // Legacy (pre-v5) rows: no uid, no updatedAt, no uid references.
  async function seedLegacyRows() {
    await db.table('items').bulkAdd([
      {
        name: 'Zinc',
        kind: 'supplement',
        dose: '25 mg',
        times: ['08:00'],
        groups: [],
        status: 'active',
        createdAt: '2026-06-01T08:00:00.000Z',
      },
    ])
    const itemId = (await db.table('items').toArray())[0].id as number
    await db.table('intakes').bulkAdd([
      {
        itemId,
        date: '2026-06-02',
        time: '08:00',
        takenAt: '2026-06-02T08:01:00.000Z',
      },
    ])
    await db.table('stackEvents').bulkAdd([
      {
        itemId,
        date: '2026-06-01',
        type: 'added',
        itemName: 'Zinc',
        summary: 'added to stack',
      },
    ])
    return itemId
  }

  it('fills uid/updatedAt and wires uid references from numeric ids', async () => {
    await seedLegacyRows()

    await backfillIdentity(db)

    const item = (await db.items.toArray())[0]
    const intake = (await db.intakes.toArray())[0]
    const event = (await db.stackEvents.toArray())[0]

    expect(item.uid).toBeTruthy()
    expect(item.updatedAt).toBe('2026-06-01T08:00:00.000Z') // from createdAt
    expect(intake.uid).toBeTruthy()
    expect(intake.updatedAt).toBe('2026-06-02T08:01:00.000Z') // from takenAt
    expect(intake.itemUid).toBe(item.uid)
    expect(event.itemUid).toBe(item.uid)
  })

  it('is idempotent — running twice changes nothing', async () => {
    await seedLegacyRows()
    await backfillIdentity(db)
    const first = await db.items.toArray()

    await backfillIdentity(db)
    const second = await db.items.toArray()

    expect(second).toEqual(first)
  })
})

describe('importing pre-v5 backups', () => {
  it('adds sync identity to old-format bundles on import', async () => {
    const legacyBundle = JSON.stringify({
      app: 'StackTrack',
      schemaVersion: 4,
      exportedAt: '2026-06-10T00:00:00.000Z',
      data: {
        items: [
          {
            id: 1,
            name: 'Zinc',
            kind: 'supplement',
            dose: '25 mg',
            times: ['08:00'],
            groups: [],
            status: 'active',
            createdAt: '2026-06-01T08:00:00.000Z',
          },
        ],
        intakes: [
          {
            id: 1,
            itemId: 1,
            date: '2026-06-02',
            time: '08:00',
            takenAt: '2026-06-02T08:01:00.000Z',
          },
        ],
      },
    })

    await applyBundle(parseBundle(legacyBundle))

    const item = (await db.items.toArray())[0]
    const intake = (await db.intakes.toArray())[0]
    expect(item.uid).toBeTruthy()
    expect(intake.itemUid).toBe(item.uid)
  })
})
