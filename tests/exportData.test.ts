// tests/exportData.test.ts — behavior tests for the export builders: the
// JSON bundle carries every table in full, and the CSV serialization
// handles quoting, arrays, and optional columns correctly.
import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '../src/db/db'
import { addItem } from '../src/db/stackRepository'
import { addMetric } from '../src/db/metricRepository'
import { setMetricEntry } from '../src/db/metricEntryRepository'
import { setDayNote } from '../src/db/dayNoteRepository'
import { markTaken } from '../src/db/intakeRepository'
import {
  buildExportBundle,
  buildExportCsv,
  toCsvValue,
} from '../src/lib/exportData'

beforeEach(async () => {
  await db.items.clear()
  await db.stackEvents.clear()
  await db.intakes.clear()
  await db.itemNotes.clear()
  await db.metrics.clear()
  await db.metricEntries.clear()
  await db.dayNotes.clear()
})

describe('buildExportBundle', () => {
  it('includes every table with matching row counts', async () => {
    const itemId = await addItem({
      name: 'Zinc, chelated', // comma on purpose — exercises CSV quoting too
      kind: 'supplement',
      dose: '25 mg',
      times: ['08:00', '20:00'],
      groups: ['Testosterone Support'],
    })
    await markTaken(itemId, '2026-06-11', '08:00')
    const metricId = await addMetric({ name: 'Energy', kind: 'rating' })
    await setMetricEntry(metricId, '2026-06-11', 7)
    await setDayNote('2026-06-11', 'long day')

    const bundle = await buildExportBundle()

    expect(bundle.app).toBe('StackTrack')
    expect(bundle.schemaVersion).toBe(8)
    expect(bundle.data.items).toHaveLength(1)
    expect(bundle.data.stackEvents).toHaveLength(1) // the 'added' event
    expect(bundle.data.intakes).toHaveLength(1)
    expect(bundle.data.metrics).toHaveLength(1)
    expect(bundle.data.metricEntries).toHaveLength(1)
    expect(bundle.data.dayNotes).toHaveLength(1)
    expect(bundle.data.itemNotes).toHaveLength(0)
  })
})

describe('toCsvValue', () => {
  it('quotes fields containing commas and doubles inner quotes', () => {
    expect(toCsvValue('Zinc, chelated')).toBe('"Zinc, chelated"')
    expect(toCsvValue('he said "hi"')).toBe('"he said ""hi"""')
  })

  it('joins arrays into one cell and blanks null/undefined', () => {
    expect(toCsvValue(['08:00', '20:00'])).toBe('08:00; 20:00')
    expect(toCsvValue(undefined)).toBe('')
  })
})

describe('buildExportCsv', () => {
  it('writes one labeled section per table with all columns', async () => {
    await addItem({
      name: 'Zinc, chelated',
      kind: 'supplement',
      dose: '25 mg',
      times: ['08:00', '20:00'],
      groups: ['Testosterone Support'],
    })

    const csv = buildExportCsv(await buildExportBundle())

    expect(csv).toContain('items\n')
    expect(csv).toContain('stackEvents\n')
    expect(csv).toContain('dayNotes') // empty tables still get their section
    expect(csv).toContain('"Zinc, chelated"')
    expect(csv).toContain('08:00; 20:00')
    expect(csv).toContain('Testosterone Support')
  })
})
