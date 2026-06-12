// src/db/intakeRepository.ts — the only write path for intake records
// (the Today checklist's taken/not-taken state). Reads may query db directly.
import { db } from './db'
import { newUid, nowIso } from '../lib/identity'

// Marks one scheduled slot taken. Already marked = no-op (no duplicates).
export async function markTaken(
  itemId: number,
  date: string,
  time: string,
): Promise<void> {
  await db.transaction('rw', db.intakes, db.items, async () => {
    const existing = await findIntake(itemId, date, time)
    if (existing) return
    const item = await db.items.get(itemId)
    const stamp = nowIso()
    await db.intakes.add({
      uid: newUid(),
      itemId,
      itemUid: item?.uid ?? '',
      date,
      time,
      takenAt: stamp,
      updatedAt: stamp,
    })
  })
}

// Undoes a mark (mistap recovery). Not marked = no-op.
export async function unmarkTaken(
  itemId: number,
  date: string,
  time: string,
): Promise<void> {
  await db.transaction('rw', db.intakes, async () => {
    const existing = await findIntake(itemId, date, time)
    if (existing) await db.intakes.delete(existing.id)
  })
}

async function findIntake(itemId: number, date: string, time: string) {
  const sameDay = await db.intakes
    .where('[itemId+date]')
    .equals([itemId, date])
    .toArray()
  return sameDay.find((intake) => intake.time === time)
}
