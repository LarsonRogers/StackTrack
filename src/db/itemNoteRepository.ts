// src/db/itemNoteRepository.ts — the only write path for per-item daily
// notes (e.g. "ran out of pills" on today's Zinc entry). One note per
// (itemId, date): setting replaces, empty text clears.
import { db } from './db'
import { newUid, nowIso } from '../lib/identity'

// Saves the note for an item on a date. Empty/whitespace text deletes it —
// the UI offers no separate delete action.
export async function setItemNote(
  itemId: number,
  date: string,
  text: string,
): Promise<void> {
  const trimmed = text.trim()
  await db.transaction('rw', db.itemNotes, db.items, async () => {
    const existing = await db.itemNotes
      .where('[itemId+date]')
      .equals([itemId, date])
      .first()

    if (trimmed === '') {
      if (existing) await db.itemNotes.delete(existing.id)
      return
    }

    if (existing) {
      await db.itemNotes.update(existing.id, {
        text: trimmed,
        updatedAt: nowIso(),
      })
    } else {
      const item = await db.items.get(itemId)
      await db.itemNotes.add({
        uid: newUid(),
        itemId,
        itemUid: item?.uid ?? '',
        date,
        text: trimmed,
        updatedAt: nowIso(),
      })
    }
  })
}
