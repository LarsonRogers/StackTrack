// tests/mergeData.test.ts — behavior tests for the merge engine ("Sync from
// file"): new-record adoption with reference rewiring across colliding local
// ids, newest-wins conflicts, natural-key convergence for same-day records,
// no deletions, dry-run purity, and the pre-v5 floor.
import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '../src/db/db'
import { addItem } from '../src/db/stackRepository'
import { addMetric } from '../src/db/metricRepository'
import { setItemNote } from '../src/db/itemNoteRepository'
import { setMetricNote } from '../src/db/metricNoteRepository'
import { buildExportBundle, type ExportBundle } from '../src/lib/exportData'
import { mergeBundle } from '../src/lib/mergeData'

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

// A v5-shaped bundle as another device would export it.
function bundleWith(data: Partial<ExportBundle['data']>): ExportBundle {
  return {
    app: 'StackTrack',
    exportedAt: '2026-06-12T10:00:00.000Z',
    schemaVersion: 5,
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
      ...data,
    },
  }
}

const PHONE_ITEM = {
  id: 1, // deliberately collides with the PC's local id 1
  uid: 'phone-item-uid',
  name: 'Magnesium',
  kind: 'supplement',
  dose: '400 mg',
  times: ['20:00'],
  groups: [],
  status: 'active',
  createdAt: '2026-06-10T08:00:00.000Z',
  updatedAt: '2026-06-10T08:00:00.000Z',
}

describe('mergeBundle', () => {
  it('rejects pre-v5 bundles with guidance', async () => {
    const old = { ...bundleWith({}), schemaVersion: 4 }
    await expect(mergeBundle(old, false)).rejects.toThrow(/older app version/)
  })

  it('adds new records and rewires references across colliding ids', async () => {
    // PC already has its own item id 1
    await addItem({
      name: 'Zinc',
      kind: 'supplement',
      dose: '25 mg',
      times: ['08:00'],
      groups: [],
    })

    const bundle = bundleWith({
      items: [PHONE_ITEM],
      intakes: [
        {
          id: 7,
          uid: 'phone-intake-uid',
          itemId: 1, // the PHONE's id 1 — must NOT be trusted
          itemUid: 'phone-item-uid',
          date: '2026-06-11',
          time: '20:00',
          takenAt: '2026-06-11T20:01:00.000Z',
          updatedAt: '2026-06-11T20:01:00.000Z',
        },
      ],
    })

    const summary = await mergeBundle(bundle, true)

    expect(summary.added).toBe(2)
    const items = await db.items.toArray()
    expect(items).toHaveLength(2)
    const magnesium = items.find((i) => i.uid === 'phone-item-uid')!
    const intake = (await db.intakes.toArray())[0]
    expect(intake.itemId).toBe(magnesium.id) // rewired to the LOCAL id
    expect(magnesium.id).not.toBe(1) // collision avoided
  })

  it('keeps the newer copy on uid conflicts, both directions', async () => {
    await db.items.add({ ...PHONE_ITEM, id: undefined } as never)
    const local = (await db.items.toArray())[0]

    // incoming is NEWER → wins
    const newer = bundleWith({
      items: [
        {
          ...PHONE_ITEM,
          dose: '500 mg',
          updatedAt: '2026-06-12T09:00:00.000Z',
        },
      ],
    })
    let summary = await mergeBundle(newer, true)
    expect(summary.updated).toBe(1)
    expect((await db.items.get(local.id))?.dose).toBe('500 mg')

    // incoming is OLDER → ignored
    const older = bundleWith({
      items: [
        {
          ...PHONE_ITEM,
          dose: '100 mg',
          updatedAt: '2026-06-01T00:00:00.000Z',
        },
      ],
    })
    summary = await mergeBundle(older, true)
    expect(summary.unchanged).toBe(1)
    expect((await db.items.get(local.id))?.dose).toBe('500 mg')
  })

  it('converges same-day singletons created independently on two devices', async () => {
    const itemId = await addItem({
      name: 'Zinc',
      kind: 'supplement',
      dose: '25 mg',
      times: ['08:00'],
      groups: [],
    })
    await setItemNote(itemId, '2026-06-11', 'PC note')
    const localItem = (await db.items.toArray())[0]

    const bundle = bundleWith({
      items: [], // same item known on phone via earlier sync — not resent here
      itemNotes: [
        {
          id: 3,
          uid: 'phone-note-uid', // DIFFERENT uid — created independently
          itemId: 99,
          itemUid: localItem.uid, // same item, same date
          date: '2026-06-11',
          text: 'phone note, written later',
          updatedAt: '2099-01-01T00:00:00.000Z',
        },
      ],
    })

    await mergeBundle(bundle, true)

    const notes = await db.itemNotes.toArray()
    expect(notes).toHaveLength(1) // converged, not duplicated
    expect(notes[0].text).toBe('phone note, written later')
    expect(notes[0].itemId).toBe(localItem.id) // local wiring preserved
  })

  it('converges a same metric+date note created independently on two devices', async () => {
    const metricId = await addMetric({ name: 'Weight', kind: 'number' })
    await setMetricNote(metricId, '2026-06-11', 'PC note')
    const localMetric = (await db.metrics.toArray())[0]

    const bundle = bundleWith({
      metrics: [], // same metric known on phone via earlier sync — not resent
      metricNotes: [
        {
          id: 7,
          uid: 'phone-metric-note-uid', // DIFFERENT uid — created independently
          metricId: 99,
          metricUid: localMetric.uid, // same metric, same date
          date: '2026-06-11',
          text: 'phone note, written later',
          updatedAt: '2099-01-01T00:00:00.000Z',
        },
      ],
    })

    await mergeBundle(bundle, true)

    const notes = await db.metricNotes.toArray()
    expect(notes).toHaveLength(1) // converged on natural key, not duplicated
    expect(notes[0].text).toBe('phone note, written later') // newest wins
    expect(notes[0].metricId).toBe(localMetric.id) // local wiring preserved
  })

  it('never deletes local records and skips orphans rather than inventing parents', async () => {
    await addItem({
      name: 'Zinc',
      kind: 'supplement',
      dose: '25 mg',
      times: ['08:00'],
      groups: [],
    })
    await addMetric({ name: 'Energy', kind: 'rating' })

    const bundle = bundleWith({
      metricEntries: [
        {
          id: 1,
          uid: 'orphan-entry',
          metricId: 5,
          metricUid: 'unknown-metric-uid', // parent never synced
          date: '2026-06-11',
          value: 7,
          updatedAt: '2026-06-11T00:00:00.000Z',
        },
      ],
    })

    const summary = await mergeBundle(bundle, true)

    expect(summary.skipped).toBe(1)
    expect(await db.metricEntries.count()).toBe(0)
    expect(await db.items.count()).toBe(1) // everything local survives
    expect(await db.metrics.count()).toBe(1)
  })

  it('dry-run computes the summary without writing anything', async () => {
    const bundle = bundleWith({ items: [PHONE_ITEM] })

    const summary = await mergeBundle(bundle, false)

    expect(summary.added).toBe(1)
    expect(await db.items.count()).toBe(0)
  })

  it('adds a health event, then dedupes it by uid on re-merge', async () => {
    const phoneEvent = {
      id: 4,
      uid: 'phone-event-uid',
      date: '2026-06-16',
      label: 'Fever',
      category: 'symptom',
      updatedAt: '2026-06-16T09:00:00.000Z',
    }
    const bundle = bundleWith({ healthEvents: [phoneEvent] })

    let summary = await mergeBundle(bundle, true)
    expect(summary.added).toBe(1)
    expect(await db.healthEvents.count()).toBe(1)
    expect((await db.healthEvents.toArray())[0].id).not.toBe(4) // local id

    // same uid again → no duplicate
    summary = await mergeBundle(bundle, true)
    expect(summary.unchanged).toBe(1)
    expect(await db.healthEvents.count()).toBe(1)
  })

  it('round-trip self-merge is a no-op', async () => {
    await addItem({
      name: 'Zinc',
      kind: 'supplement',
      dose: '25 mg',
      times: ['08:00'],
      groups: [],
    })
    const bundle = await buildExportBundle()

    const summary = await mergeBundle(bundle, true)

    expect(summary.added).toBe(0)
    expect(summary.updated).toBe(0)
    expect(summary.unchanged).toBeGreaterThan(0)
    expect(await db.items.count()).toBe(1)
  })
})
