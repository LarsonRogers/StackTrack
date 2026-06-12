// src/db/tombstoneRepository.ts — the only write path for deletion markers.
// Every repository that hard-deletes a record calls recordTombstone in the
// SAME transaction, so a deletion can never happen without its marker —
// the invariant sync and merge rely on to propagate deletions.
import { db } from './db'
import { nowIso } from '../lib/identity'

// Marks `uid` deleted now. Upserts: a repeated delete refreshes the time.
export async function recordTombstone(uid: string): Promise<void> {
  const existing = await db.tombstones.where('uid').equals(uid).first()
  if (existing) {
    await db.tombstones.update(existing.id, { deletedAt: nowIso() })
  } else {
    await db.tombstones.add({ uid, deletedAt: nowIso() })
  }
}
