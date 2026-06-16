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
  unit?: string // optional dose unit, e.g. "mg"
  times: string[]
  groups: string[] // [] = ungrouped; an item may belong to many groups
  note?: string // persistent note shown on Today (distinct from per-day notes)
}

// Sorted + deduplicated so times compare reliably and display consistently.
function normalizeTimes(times: string[]): string[] {
  return [...new Set(times)].sort()
}

// Trim each group, drop blanks, dedupe (case-insensitive), preserve order.
function normalizeGroups(groups: string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const group of groups) {
    const trimmed = group.trim()
    const key = trimmed.toLowerCase()
    if (trimmed && !seen.has(key)) {
      seen.add(key)
      out.push(trimmed)
    }
  }
  return out
}

function normalizeInput(input: StackItemInput): StackItemInput {
  return {
    name: input.name.trim(),
    kind: input.kind,
    dose: input.dose.trim(),
    unit: input.unit?.trim() || undefined,
    times: normalizeTimes(input.times),
    groups: normalizeGroups(input.groups ?? []),
    note: input.note?.trim() || undefined,
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
  if ((before.unit ?? '') !== (after.unit ?? ''))
    parts.push(`unit: ${before.unit ?? 'none'} → ${after.unit ?? 'none'}`)
  if (before.times.join(',') !== after.times.join(','))
    parts.push(`times: ${before.times.join(', ')} → ${after.times.join(', ')}`)
  // Compare as sets (sorted) so reordering groups is not a "change".
  const beforeGroups = (before.groups ?? []).toSorted().join('')
  const afterGroups = (after.groups ?? []).toSorted().join('')
  if (beforeGroups !== afterGroups)
    parts.push(
      `groups: ${fmtGroups(before.groups)} → ${fmtGroups(after.groups)}`,
    )
  // Persistent note: flag the change without dumping (possibly long) text
  // into the history summary and graph-marker labels.
  if ((before.note ?? '') !== (after.note ?? '')) parts.push('note updated')
  return parts.length > 0 ? parts.join('; ') : null
}

function fmtGroups(groups: string[] | undefined): string {
  return groups && groups.length > 0 ? groups.join(', ') : 'none'
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
      unit: existing.unit,
      times: existing.times,
      groups: existing.groups,
      note: existing.note,
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

// Snapshot name/groups onto the event so history survives later renames.
async function recordEvent(
  itemId: number,
  itemUid: string,
  snapshot: Pick<StackItemInput, 'name' | 'groups'>,
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
    groups: snapshot.groups ?? [],
    summary,
    updatedAt: nowIso(),
  })
}
