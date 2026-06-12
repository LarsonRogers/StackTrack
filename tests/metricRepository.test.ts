// tests/metricRepository.test.ts — behavior tests for metric definitions
// (10-active cap, archive/restore) and daily values (one per metric+date,
// replace on re-log, rating validation at the boundary).
import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '../src/db/db'
import {
  addMetric,
  archiveMetric,
  MAX_ACTIVE_METRICS,
  unarchiveMetric,
  updateMetric,
} from '../src/db/metricRepository'
import {
  clearMetricEntry,
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

  it('rejects an 11th active metric', async () => {
    for (let i = 0; i < MAX_ACTIVE_METRICS; i++) {
      await addMetric({ name: `Metric ${i}`, kind: 'rating' })
    }
    await expect(
      addMetric({ name: 'One too many', kind: 'rating' }),
    ).rejects.toThrow(/archive one first/)
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

  it('archive keeps logged entries; restore re-checks the cap', async () => {
    const id = await addMetric({ name: 'Energy', kind: 'rating' })
    await setMetricEntry(id, TODAY, 7)
    await archiveMetric(id)

    expect((await db.metrics.get(id))?.status).toBe('archived')
    expect(await db.metricEntries.count()).toBe(1) // history survives

    for (let i = 0; i < MAX_ACTIVE_METRICS; i++) {
      await addMetric({ name: `Metric ${i}`, kind: 'rating' })
    }
    await expect(unarchiveMetric(id)).rejects.toThrow(/archive one first/)
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
