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
