// src/db/metricNoteRepository.ts — the only write path for per-metric daily
// notes (e.g. "measured after a run" on today's Weight entry). One note per
// (metricId, date): setting replaces, empty text clears. The metric-side
// twin of itemNoteRepository.
import { db } from './db'
import { newUid, nowIso } from '../lib/identity'
import { recordTombstone } from './tombstoneRepository'

// Saves the note for a metric on a date. Empty/whitespace text deletes it —
// the UI offers no separate delete action.
export async function setMetricNote(
  metricId: number,
  date: string,
  text: string,
): Promise<void> {
  const trimmed = text.trim()
  await db.transaction(
    'rw',
    db.metricNotes,
    db.metrics,
    db.tombstones,
    async () => {
      const existing = await db.metricNotes
        .where('[metricId+date]')
        .equals([metricId, date])
        .first()

      if (trimmed === '') {
        if (existing) {
          await db.metricNotes.delete(existing.id)
          await recordTombstone(existing.uid)
        }
        return
      }

      if (existing) {
        await db.metricNotes.update(existing.id, {
          text: trimmed,
          updatedAt: nowIso(),
        })
      } else {
        const metric = await db.metrics.get(metricId)
        await db.metricNotes.add({
          uid: newUid(),
          metricId,
          metricUid: metric?.uid ?? '',
          date,
          text: trimmed,
          updatedAt: nowIso(),
        })
      }
    },
  )
}
