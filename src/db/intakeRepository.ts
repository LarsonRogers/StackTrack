// src/db/intakeRepository.ts — the only write path for intake records
// (the Today checklist's taken/not-taken state). Reads may query db directly.
import { db } from './db'

// Marks one scheduled slot taken. Already marked = no-op (no duplicates).
export async function markTaken(
  itemId: number,
  date: string,
  time: string,
): Promise<void> {
  await db.transaction('rw', db.intakes, async () => {
    const existing = await findIntake(itemId, date, time)
    if (existing) return
    await db.intakes.add({
      itemId,
      date,
      time,
      takenAt: new Date().toISOString(),
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
