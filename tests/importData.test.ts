// tests/importData.test.ts — behavior tests for restore: validation rejects
// bad files without touching data, a full round-trip restores everything,
// older exports get empty new tables, and a failed import is atomic (the
// existing data survives untouched).
import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '../src/db/db'
import { addItem } from '../src/db/stackRepository'
import { addMetric } from '../src/db/metricRepository'
import { setMetricEntry } from '../src/db/metricEntryRepository'
import { setDayNote } from '../src/db/dayNoteRepository'
import { buildExportBundle } from '../src/lib/exportData'
import { applyBundle, parseBundle } from '../src/lib/importData'

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

async function seedRealisticData() {
  await addItem({
    name: 'Zinc',
    kind: 'supplement',
    dose: '25 mg',
    times: ['08:00'],
    groups: ['Testosterone Support'],
  })
  const metricId = await addMetric({ name: 'Energy', kind: 'rating' })
  await setMetricEntry(metricId, '2026-06-11', 7)
  await setDayNote('2026-06-11', 'long day')
}

beforeEach(clearAll)

describe('parseBundle', () => {
  it('rejects non-JSON text', () => {
    expect(() => parseBundle('not json at all')).toThrow(/isn't valid JSON/)
  })

  it('rejects JSON that is not a StackTrack export', () => {
    expect(() => parseBundle('{"app":"SomethingElse"}')).toThrow(
      /isn't a StackTrack export/,
    )
  })

  it('rejects exports from a newer schema version', () => {
    const text = JSON.stringify({
      app: 'StackTrack',
      schemaVersion: 99,
      data: {},
    })
    expect(() => parseBundle(text)).toThrow(/newer version/)
  })

  it('defaults tables missing from older exports to empty', () => {
    const text = JSON.stringify({
      app: 'StackTrack',
      schemaVersion: 3, // pre-dayNotes
      exportedAt: '2026-06-01T00:00:00Z',
      data: { items: [], metrics: [] },
    })
    const bundle = parseBundle(text)
    expect(bundle.data.dayNotes).toEqual([])
    expect(bundle.data.stackEvents).toEqual([])
  })

  it('rejects a damaged table that is not a list', () => {
    const text = JSON.stringify({
      app: 'StackTrack',
      schemaVersion: 4,
      data: { items: 'oops' },
    })
    expect(() => parseBundle(text)).toThrow(/damaged/)
  })
})

describe('applyBundle', () => {
  it('round-trips: export, wipe, import, everything is back', async () => {
    await seedRealisticData()
    const bundle = await buildExportBundle()

    await clearAll()
    expect(await db.items.count()).toBe(0)

    await applyBundle(parseBundle(JSON.stringify(bundle)))

    expect(await db.items.count()).toBe(1)
    expect((await db.items.toArray())[0].name).toBe('Zinc')
    expect(await db.stackEvents.count()).toBe(1)
    expect((await db.metricEntries.toArray())[0].value).toBe(7)
    expect((await db.dayNotes.toArray())[0].text).toBe('long day')
  })

  it('replaces current data rather than merging', async () => {
    await seedRealisticData()
    const backup = await buildExportBundle()

    await clearAll()
    await addItem({
      name: 'Creatine',
      kind: 'supplement',
      dose: '5 g',
      times: ['09:00'],
      groups: [],
    })

    await applyBundle(backup)

    const items = await db.items.toArray()
    expect(items).toHaveLength(1)
    expect(items[0].name).toBe('Zinc') // Creatine is gone — restore semantics
  })

  it('leaves current data untouched when the import fails mid-way', async () => {
    await seedRealisticData()

    const bad = await buildExportBundle()
    // duplicate primary keys → bulkAdd throws → transaction must roll back
    bad.data.metrics = [
      { id: 1, name: 'A', kind: 'rating', status: 'active', createdAt: '' },
      { id: 1, name: 'B', kind: 'rating', status: 'active', createdAt: '' },
    ]

    await expect(applyBundle(bad)).rejects.toThrow()

    // original seed survives — nothing was half-applied
    expect(await db.items.count()).toBe(1)
    expect((await db.metrics.toArray())[0].name).toBe('Energy')
  })
})
