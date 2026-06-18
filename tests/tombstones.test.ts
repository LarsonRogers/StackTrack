// tests/tombstones.test.ts — behavior tests for deletion propagation:
// every clearing action records a tombstone in the same transaction, and
// the merge engine applies, suppresses with, and retires tombstones
// correctly ("a deletion travels; a newer edit survives").
import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '../src/db/db'
import { addItem } from '../src/db/stackRepository'
import { markTaken, unmarkTaken } from '../src/db/intakeRepository'
import { setItemNote } from '../src/db/itemNoteRepository'
import { addMetric } from '../src/db/metricRepository'
import {
  clearMetricEntry,
  setMetricEntry,
} from '../src/db/metricEntryRepository'
import { setDayNote } from '../src/db/dayNoteRepository'
import { buildExportBundle, type ExportBundle } from '../src/lib/exportData'
import { mergeBundle } from '../src/lib/mergeData'

const TODAY = '2026-06-12'

async function clearAll() {
  for (const table of [
    'items',
    'stackEvents',
    'intakes',
    'itemNotes',
    'metrics',
    'metricEntries',
    'metricNotes',
    'dayNotes',
    'healthEvents',
    'tombstones',
  ])
    await db.table(table).clear()
}

beforeEach(clearAll)

function emptyBundle(): ExportBundle {
  return {
    app: 'StackTrack',
    exportedAt: '2026-06-12T12:00:00.000Z',
    schemaVersion: 6,
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
      tombstones: [],
    },
  }
}

describe('clearing actions record tombstones', () => {
  it('unmark, note-clear, value-clear, and journal-clear each leave a marker', async () => {
    const itemId = await addItem({
      name: 'Zinc',
      kind: 'supplement',
      dose: '25 mg',
      times: ['08:00'],
      groups: [],
    })
    const metricId = await addMetric({ name: 'Energy', kind: 'rating' })

    await markTaken(itemId, TODAY, '08:00')
    await setItemNote(itemId, TODAY, 'note')
    await setMetricEntry(metricId, TODAY, 7)
    await setDayNote(TODAY, 'journal')

    await unmarkTaken(itemId, TODAY, '08:00')
    await setItemNote(itemId, TODAY, '')
    await clearMetricEntry(metricId, TODAY)
    await setDayNote(TODAY, '')

    expect(await db.tombstones.count()).toBe(4)
    expect(await db.intakes.count()).toBe(0)
    expect(await db.itemNotes.count()).toBe(0)
  })
})

describe('merge with tombstones', () => {
  it('an incoming tombstone deletes the matching local record', async () => {
    const itemId = await addItem({
      name: 'Zinc',
      kind: 'supplement',
      dose: '25 mg',
      times: ['08:00'],
      groups: [],
    })
    await markTaken(itemId, TODAY, '08:00')
    const intake = (await db.intakes.toArray())[0]

    const bundle = emptyBundle()
    bundle.data.tombstones = [
      { id: 1, uid: intake.uid, deletedAt: '2099-01-01T00:00:00.000Z' },
    ]

    const summary = await mergeBundle(bundle, true)

    expect(summary.deleted).toBe(1)
    expect(await db.intakes.count()).toBe(0)
    expect(await db.tombstones.count()).toBe(1) // marker adopted locally
  })

  it('a local tombstone stops the other device resurrecting the record', async () => {
    const itemId = await addItem({
      name: 'Zinc',
      kind: 'supplement',
      dose: '25 mg',
      times: ['08:00'],
      groups: [],
    })
    await markTaken(itemId, TODAY, '08:00')
    const intakeBefore = (await db.intakes.toArray())[0]
    const otherDeviceBundle = await buildExportBundle() // still has the intake

    await unmarkTaken(itemId, TODAY, '08:00') // deleted locally, tombstoned

    const summary = await mergeBundle(otherDeviceBundle, true)

    expect(await db.intakes.count()).toBe(0) // NOT resurrected
    expect(summary.added).toBe(0)
    void intakeBefore
  })

  it('a record edited after the tombstone survives and retires it', async () => {
    const itemId = await addItem({
      name: 'Zinc',
      kind: 'supplement',
      dose: '25 mg',
      times: ['08:00'],
      groups: [],
    })
    await setItemNote(itemId, TODAY, 'first note')
    const note = (await db.itemNotes.toArray())[0]
    await setItemNote(itemId, TODAY, '') // tombstoned locally

    // the other device edited the SAME note (same uid) AFTER our deletion
    const bundle = emptyBundle()
    bundle.data.itemNotes = [
      {
        ...note,
        text: 'edited later on the phone',
        updatedAt: '2099-01-01T00:00:00.000Z',
      },
    ]

    await mergeBundle(bundle, true)

    const notes = await db.itemNotes.toArray()
    expect(notes).toHaveLength(1)
    expect(notes[0].text).toBe('edited later on the phone')
    expect(await db.tombstones.count()).toBe(0) // stale marker retired
  })

  it('still merges bundles from before tombstones existed (v5)', async () => {
    const bundle = emptyBundle()
    bundle.schemaVersion = 5
    // @ts-expect-error — simulating an older file with no tombstones key
    delete bundle.data.tombstones
    const summary = await mergeBundle(JSON.parse(JSON.stringify(bundle)), true)
    expect(summary.deleted).toBe(0)
  })
})
