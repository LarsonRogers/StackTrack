// tests/metricRepository.test.ts — behavior tests for metric definitions
// (archive/restore, kind immutability) and daily values (one per
// metric+date, replace on re-log, rating validation at the boundary).
import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '../src/db/db'
import {
  addMetric,
  archiveMetric,
  unarchiveMetric,
  updateMetric,
} from '../src/db/metricRepository'
import {
  clearMetricEntry,
  setCompositeEntry,
  setMetricEntry,
} from '../src/db/metricEntryRepository'

const TODAY = '2026-06-11'
const YESTERDAY = '2026-06-10'

beforeEach(async () => {
  await db.metrics.clear()
  await db.metricEntries.clear()
})

describe('metric definitions', () => {
  it('adds an active metric', async () => {
    const id = await addMetric({ name: 'Energy', kind: 'rating' })
    expect(await db.metrics.get(id)).toMatchObject({
      name: 'Energy',
      kind: 'rating',
      status: 'active',
    })
  })

  it('updates name and unit but not kind', async () => {
    const id = await addMetric({ name: 'Weight', kind: 'number', unit: 'lb' })
    await updateMetric(id, { name: 'Body weight', unit: 'kg' })

    expect(await db.metrics.get(id)).toMatchObject({
      name: 'Body weight',
      unit: 'kg',
      kind: 'number', // unchanged — kind is fixed after creation
    })
  })

  it('archive keeps logged entries; restore reactivates', async () => {
    const id = await addMetric({ name: 'Energy', kind: 'rating' })
    await setMetricEntry(id, TODAY, 7)
    await archiveMetric(id)

    expect((await db.metrics.get(id))?.status).toBe('archived')
    expect(await db.metricEntries.count()).toBe(1) // history survives

    await unarchiveMetric(id)
    expect((await db.metrics.get(id))?.status).toBe('active')
  })
})

describe('metric entries', () => {
  it('logs one value per metric per day; re-logging replaces', async () => {
    const id = await addMetric({ name: 'Energy', kind: 'rating' })
    await setMetricEntry(id, TODAY, 6)
    await setMetricEntry(id, TODAY, 8)

    const entries = await db.metricEntries.toArray()
    expect(entries).toHaveLength(1)
    expect(entries[0].value).toBe(8)
  })

  it('keeps different days separate', async () => {
    const id = await addMetric({ name: 'Energy', kind: 'rating' })
    await setMetricEntry(id, YESTERDAY, 4)
    await setMetricEntry(id, TODAY, 9)

    expect(await db.metricEntries.count()).toBe(2)
  })

  it('rejects out-of-range or fractional ratings', async () => {
    const id = await addMetric({ name: 'Energy', kind: 'rating' })
    await expect(setMetricEntry(id, TODAY, 0)).rejects.toThrow(/1 to 10/)
    await expect(setMetricEntry(id, TODAY, 11)).rejects.toThrow(/1 to 10/)
    await expect(setMetricEntry(id, TODAY, 7.5)).rejects.toThrow(/1 to 10/)
  })

  it('accepts fractional values for number metrics', async () => {
    const id = await addMetric({ name: 'Weight', kind: 'number', unit: 'kg' })
    await setMetricEntry(id, TODAY, 83.6)

    expect((await db.metricEntries.toArray())[0].value).toBe(83.6)
  })

  it('clears a logged value', async () => {
    const id = await addMetric({ name: 'Energy', kind: 'rating' })
    await setMetricEntry(id, TODAY, 7)
    await clearMetricEntry(id, TODAY)

    expect(await db.metricEntries.count()).toBe(0)
  })
})

describe('composite metrics', () => {
  async function addBloodPressure() {
    return addMetric({
      name: 'Blood Pressure',
      kind: 'composite',
      components: [
        { name: 'Systolic', unit: 'mmHg' },
        { name: 'Diastolic', unit: 'mmHg' },
      ],
    })
  }

  it('stores the ordered components on the definition', async () => {
    const id = await addBloodPressure()
    expect(await db.metrics.get(id)).toMatchObject({
      kind: 'composite',
      components: [
        { name: 'Systolic', unit: 'mmHg' },
        { name: 'Diastolic', unit: 'mmHg' },
      ],
    })
  })

  it('logs all values and mirrors value from values[0]', async () => {
    const id = await addBloodPressure()
    await setCompositeEntry(id, TODAY, [120, 80])

    const entry = (await db.metricEntries.toArray())[0]
    expect(entry.values).toEqual([120, 80])
    expect(entry.value).toBe(120) // single-value readers keep working
  })

  it('re-logging replaces; one entry per day', async () => {
    const id = await addBloodPressure()
    await setCompositeEntry(id, TODAY, [120, 80])
    await setCompositeEntry(id, TODAY, [118, 78])

    const entries = await db.metricEntries.toArray()
    expect(entries).toHaveLength(1)
    expect(entries[0].values).toEqual([118, 78])
  })

  it('rejects a value count that does not match the components', async () => {
    const id = await addBloodPressure()
    await expect(setCompositeEntry(id, TODAY, [120])).rejects.toThrow(
      /Expected 2 values/,
    )
  })

  it('rejects non-finite values', async () => {
    const id = await addBloodPressure()
    await expect(setCompositeEntry(id, TODAY, [120, NaN])).rejects.toThrow(
      /must all be numbers/,
    )
  })

  it('rejects composite values for a non-composite metric', async () => {
    const id = await addMetric({ name: 'Energy', kind: 'rating' })
    await expect(setCompositeEntry(id, TODAY, [5])).rejects.toThrow(
      /not a composite/,
    )
  })
})
