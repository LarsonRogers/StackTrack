// src/db/metricEntryRepository.ts — the only write path for daily metric
// values. One entry per (metricId, date): logging again replaces. Rating
// values are validated against the metric's kind here, at the boundary,
// so bad values can never reach the graphs.
import { db } from './db'
import { newUid, nowIso } from '../lib/identity'
import { recordTombstone } from './tombstoneRepository'

// Logs (or replaces) the value for a metric on a date.
// Rating metrics accept integers 1–10 only; number metrics any finite number.
export async function setMetricEntry(
  metricId: number,
  date: string,
  value: number,
): Promise<void> {
  await db.transaction('rw', db.metrics, db.metricEntries, async () => {
    const metric = await db.metrics.get(metricId)
    if (!metric) throw new Error(`Metric ${metricId} not found`)
    if (!Number.isFinite(value)) {
      throw new Error(`Metric value must be a number, got ${value}`)
    }
    if (
      metric.kind === 'rating' &&
      (!Number.isInteger(value) || value < 1 || value > 10)
    ) {
      throw new Error(
        `Rating must be a whole number from 1 to 10, got ${value}`,
      )
    }
    if (metric.kind === 'boolean' && value !== 0 && value !== 1) {
      throw new Error(`Boolean value must be 0 or 1, got ${value}`)
    }

    const existing = await db.metricEntries
      .where('[metricId+date]')
      .equals([metricId, date])
      .first()
    if (existing) {
      await db.metricEntries.update(existing.id, {
        value,
        updatedAt: nowIso(),
      })
    } else {
      await db.metricEntries.add({
        uid: newUid(),
        metricId,
        metricUid: metric.uid,
        date,
        value,
        updatedAt: nowIso(),
      })
    }
  })
}

// Logs (or replaces) a composite metric's values for a date — one finite
// number per component, in component order. `value` mirrors values[0] so the
// existing single-value readers (graphs, tooltips) keep working unchanged.
export async function setCompositeEntry(
  metricId: number,
  date: string,
  values: number[],
): Promise<void> {
  await db.transaction('rw', db.metrics, db.metricEntries, async () => {
    const metric = await db.metrics.get(metricId)
    if (!metric) throw new Error(`Metric ${metricId} not found`)
    if (metric.kind !== 'composite') {
      throw new Error(`Metric ${metricId} is not a composite metric`)
    }
    const expected = metric.components?.length ?? 0
    if (values.length !== expected) {
      throw new Error(
        `Expected ${expected} values for ${metric.name}, got ${values.length}`,
      )
    }
    if (!values.every((v) => Number.isFinite(v))) {
      throw new Error('Composite values must all be numbers')
    }

    const existing = await db.metricEntries
      .where('[metricId+date]')
      .equals([metricId, date])
      .first()
    if (existing) {
      await db.metricEntries.update(existing.id, {
        value: values[0],
        values,
        updatedAt: nowIso(),
      })
    } else {
      await db.metricEntries.add({
        uid: newUid(),
        metricId,
        metricUid: metric.uid,
        date,
        value: values[0],
        values,
        updatedAt: nowIso(),
      })
    }
  })
}

// Removes the value for a metric on a date (e.g. logged by mistake).
export async function clearMetricEntry(
  metricId: number,
  date: string,
): Promise<void> {
  await db.transaction('rw', db.metricEntries, db.tombstones, async () => {
    const existing = await db.metricEntries
      .where('[metricId+date]')
      .equals([metricId, date])
      .first()
    if (!existing) return
    await db.metricEntries.delete(existing.id)
    await recordTombstone(existing.uid)
  })
}
