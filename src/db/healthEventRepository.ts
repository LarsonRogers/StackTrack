// src/db/healthEventRepository.ts — the only write path for per-day health
// events (e.g. "Fever", "GI Doc Appointment"). Many per date, each
// individually deletable. Deleting records a tombstone in the SAME
// transaction so the removal propagates through sync/merge — the same
// invariant intakes, notes, and metric values follow.
import { db, type EventCategory } from './db'
import { newUid, nowIso } from '../lib/identity'
import { recordTombstone } from './tombstoneRepository'

// Logs a new event for a date. Empty labels are rejected at the boundary so
// no blank event can reach the list or a graph marker.
export async function addHealthEvent(
  date: string,
  label: string,
  category: EventCategory,
): Promise<number> {
  const trimmed = label.trim()
  if (trimmed === '') throw new Error('An event needs a label.')
  return db.healthEvents.add({
    uid: newUid(),
    date,
    label: trimmed,
    category,
    updatedAt: nowIso(),
  })
}

// Edits an existing event's label and/or category. Date is fixed (re-log on
// another day instead). Empty labels are rejected, as on add.
export async function updateHealthEvent(
  id: number,
  input: { label: string; category: EventCategory },
): Promise<void> {
  const trimmed = input.label.trim()
  if (trimmed === '') throw new Error('An event needs a label.')
  await db.healthEvents.update(id, {
    label: trimmed,
    category: input.category,
    updatedAt: nowIso(),
  })
}

// Removes an event and records its tombstone atomically.
export async function deleteHealthEvent(id: number): Promise<void> {
  await db.transaction('rw', db.healthEvents, db.tombstones, async () => {
    const existing = await db.healthEvents.get(id)
    if (!existing) return
    await db.healthEvents.delete(id)
    await recordTombstone(existing.uid)
  })
}
