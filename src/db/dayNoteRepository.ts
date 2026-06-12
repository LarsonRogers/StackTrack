// src/db/dayNoteRepository.ts — the only write path for the day-level
// journal. One note per date: setting replaces, empty text clears (the UI
// offers no separate delete action — same convention as item notes).
import { db } from './db'

export async function setDayNote(date: string, text: string): Promise<void> {
  const trimmed = text.trim()
  await db.transaction('rw', db.dayNotes, async () => {
    const existing = await db.dayNotes.where('date').equals(date).first()

    if (trimmed === '') {
      if (existing) await db.dayNotes.delete(existing.id)
      return
    }

    if (existing) {
      await db.dayNotes.update(existing.id, { text: trimmed })
    } else {
      await db.dayNotes.add({ date, text: trimmed })
    }
  })
}
