// src/db/stackRepository.ts — the ONLY write path to the stack tables.
// Every mutation runs in one transaction that updates the item AND records
// its StackEvent, so the change history (and the graph markers built from
// it) can never silently drift from the data. Reads may query db directly.
import { db, type ItemKind, type StackItem } from './db'
import { toIsoDate } from '../lib/dates'
import { newUid, nowIso } from '../lib/identity'

// What the user supplies when creating or editing an item.
export interface StackItemInput {
  name: string
  kind: ItemKind
  dose: string
  times: string[]
  group?: string
}

// Sorted + deduplicated so times compare reliably and display consistently.
function normalizeTimes(times: string[]): string[] {
  return [...new Set(times)].sort()
}

function normalizeInput(input: StackItemInput): StackItemInput {
  return {
    name: input.name.trim(),
    kind: input.kind,
    dose: input.dose.trim(),
    times: normalizeTimes(input.times),
    group: input.group?.trim() || undefined,
  }
}

// Builds the human-readable "what changed" text for a 'changed' event,
// e.g. "dose: 25 mg → 50 mg; times: 08:00 → 08:00, 20:00".
// Returns null when nothing effectively changed — callers skip the event.
export function buildChangeSummary(
  before: StackItemInput,
  after: StackItemInput,
): string | null {
  const parts: string[] = []
  if (before.name !== after.name)
    parts.push(`name: ${before.name} → ${after.name}`)
  if (before.kind !== after.kind)
    parts.push(`type: ${before.kind} → ${after.kind}`)
  if (before.dose !== after.dose)
    parts.push(`dose: ${before.dose} → ${after.dose}`)
  if (before.times.join(',') !== after.times.join(','))
    parts.push(`times: ${before.times.join(', ')} → ${after.times.join(', ')}`)
  if ((before.group ?? '') !== (after.group ?? ''))
    parts.push(`group: ${before.group ?? 'none'} → ${after.group ?? 'none'}`)
  return parts.length > 0 ? parts.join('; ') : null
}

// Adds an item and records its 'added' event. Returns the new item id.
export async function addItem(input: StackItemInput): Promise<number> {
  const item = normalizeInput(input)
  return db.transaction('rw', db.items, db.stackEvents, async () => {
    const uid = newUid()
    const stamp = nowIso()
    const id = await db.items.add({
      ...item,
      uid,
      status: 'active',
      createdAt: stamp,
      updatedAt: stamp,
    })
    await recordEvent(id, uid, item, 'added', 'added to stack')
    return id
  })
}

// Applies edits and records one 'changed' event describing them.
// A no-op edit (same values) records nothing.
export async function updateItem(
  id: number,
  input: StackItemInput,
): Promise<void> {
  const after = normalizeInput(input)
  await db.transaction('rw', db.items, db.stackEvents, async () => {
    const existing = await mustGetItem(id)
    const before: StackItemInput = {
      name: existing.name,
      kind: existing.kind,
      dose: existing.dose,
      times: existing.times,
      group: existing.group,
    }
    const summary = buildChangeSummary(before, after)
    if (summary === null) return
    // put (full replace) instead of update: Dexie's UpdateSpec typing does
    // not accept plain array properties like `times`
    await db.items.put({ ...existing, ...after, updatedAt: nowIso() })
    await recordEvent(id, existing.uid, after, 'changed', summary)
  })
}

// Archives (never deletes — history must stay intact) + 'removed' event.
export async function archiveItem(id: number): Promise<void> {
  await db.transaction('rw', db.items, db.stackEvents, async () => {
    const item = await mustGetItem(id)
    await db.items.update(id, { status: 'archived', updatedAt: nowIso() })
    await recordEvent(id, item.uid, item, 'removed', 'removed from stack')
  })
}

// Restores an archived item; counts as 'added' again for the history.
export async function unarchiveItem(id: number): Promise<void> {
  await db.transaction('rw', db.items, db.stackEvents, async () => {
    const item = await mustGetItem(id)
    await db.items.update(id, { status: 'active', updatedAt: nowIso() })
    await recordEvent(id, item.uid, item, 'added', 're-added to stack')
  })
}

async function mustGetItem(id: number): Promise<StackItem> {
  const item = await db.items.get(id)
  if (!item) throw new Error(`Stack item ${id} not found`)
  return item
}

// Snapshot name/group onto the event so history survives later renames.
async function recordEvent(
  itemId: number,
  itemUid: string,
  snapshot: Pick<StackItemInput, 'name' | 'group'>,
  type: 'added' | 'changed' | 'removed',
  summary: string,
): Promise<void> {
  await db.stackEvents.add({
    uid: newUid(),
    itemId,
    itemUid,
    date: toIsoDate(new Date()),
    type,
    itemName: snapshot.name,
    group: snapshot.group,
    summary,
    updatedAt: nowIso(),
  })
}
