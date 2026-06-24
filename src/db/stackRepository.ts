// src/db/stackRepository.ts — the ONLY write path to the stack tables.
// Every mutation runs in one transaction that updates the item AND records
// its StackEvent, so the change history (and the graph markers built from
// it) can never silently drift from the data. Reads may query db directly.
import { db, type ItemKind, type Schedule, type StackItem } from './db'
import { toIsoDate } from '../lib/dates'
import {
  describeSchedule,
  timeOfDayBuckets,
  TIME_OF_DAY_LABELS,
  type TimeOfDay,
} from '../lib/schedule'
import { newUid, nowIso } from '../lib/identity'

// What the user supplies when creating or editing an item.
export interface StackItemInput {
  name: string
  kind: ItemKind
  dose: string
  unit?: string // optional dose unit, e.g. "mg"
  times: string[]
  groups: string[] // [] = ungrouped; an item may belong to many groups
  schedule?: Schedule // recurrence cadence; absent / degenerate = every day
  note?: string // persistent note shown on Today (distinct from per-day notes)
  quantityOnHand?: number // refill runway (#27): units on hand; absent = not tracked
  quantityAsOf?: string // local 'YYYY-MM-DD' the count was accurate; default today
  unitsPerDose?: number // units consumed per scheduled time; absent = 1
}

// Collapses a schedule to its canonical form, mapping degenerate cases that
// mean "every day" back to undefined so the every-day default stays canonical
// (n:1, no weekdays, or a zero off-period are all just "daily").
function normalizeSchedule(
  schedule: Schedule | undefined,
): Schedule | undefined {
  if (!schedule) return undefined

  if (schedule.kind === 'everyNDays') {
    const n = Math.floor(schedule.n)
    if (!Number.isFinite(n) || n < 2) return undefined
    return { kind: 'everyNDays', n, startDate: schedule.startDate }
  }

  if (schedule.kind === 'daysOfWeek') {
    const days = [...new Set(schedule.days)]
      .filter((d) => Number.isInteger(d) && d >= 0 && d <= 6)
      .sort((a, b) => a - b)
    if (days.length === 0 || days.length === 7) return undefined
    return { kind: 'daysOfWeek', days }
  }

  const onWeeks = Math.floor(schedule.onWeeks)
  const offWeeks = Math.floor(schedule.offWeeks)
  if (onWeeks < 1 || offWeeks < 1) return undefined // no real off-period ⇒ daily
  return { kind: 'cycle', onWeeks, offWeeks, startDate: schedule.startDate }
}

// Stable comparison key for a normalized schedule (undefined = every day).
function scheduleKey(schedule: Schedule | undefined): string {
  return JSON.stringify(schedule ?? null)
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

// A non-negative finite count, else undefined (absent = runway not tracked).
// Zero is valid — it means "you're out, refill".
function normalizeQuantity(value: number | undefined): number | undefined {
  if (value === undefined || !Number.isFinite(value) || value < 0)
    return undefined
  return value
}

// Units consumed per scheduled dose — a whole number ≥ 2 is stored; 1 (the
// default) and anything invalid collapse to undefined so "absent = 1" stays
// the single canonical form.
function normalizeUnitsPerDose(value: number | undefined): number | undefined {
  if (value === undefined) return undefined
  const n = Math.floor(value)
  return Number.isFinite(n) && n >= 2 ? n : undefined
}

// Accepts only a 'YYYY-MM-DD' string; anything else is undefined (callers
// default the runway anchor to today when a count is present).
function normalizeIsoDate(value: string | undefined): string | undefined {
  return value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : undefined
}

function normalizeInput(input: StackItemInput): StackItemInput {
  const quantityOnHand = normalizeQuantity(input.quantityOnHand)
  return {
    name: input.name.trim(),
    kind: input.kind,
    dose: input.dose.trim(),
    unit: input.unit?.trim() || undefined,
    times: normalizeTimes(input.times),
    groups: normalizeGroups(input.groups ?? []),
    schedule: normalizeSchedule(input.schedule),
    note: input.note?.trim() || undefined,
    quantityOnHand,
    // Anchor only matters when a count exists; left undefined here and defaulted
    // to today by add/update when the user supplied none.
    quantityAsOf:
      quantityOnHand === undefined
        ? undefined
        : normalizeIsoDate(input.quantityAsOf),
    unitsPerDose: normalizeUnitsPerDose(input.unitsPerDose),
  }
}

// Builds the human-readable "what changed" text for a 'changed' event, e.g.
// "dose: 25 mg → 50 mg; time of day: Morning → Afternoon". Returns null when
// nothing MARKER-WORTHY changed — callers then save the edit but record no
// StackEvent / graph marker.
//
// A stack change (graph marker) is only the pharmacologically/temporally
// meaningful edits: dose, dose-unit, schedule cadence, and a time-of-day
// BUCKET crossing (not minute-level time tweaks). Organizational edits — name,
// type, group membership, the persistent note — are saved silently (handled in
// updateItem's no-op check), so they never clutter the metric graph with
// markers that don't reflect a real change to the stack.
export function buildChangeSummary(
  before: StackItemInput,
  after: StackItemInput,
): string | null {
  const parts: string[] = []
  if (before.dose !== after.dose)
    parts.push(`dose: ${before.dose} → ${after.dose}`)
  if ((before.unit ?? '') !== (after.unit ?? ''))
    parts.push(`unit: ${before.unit ?? 'none'} → ${after.unit ?? 'none'}`)
  if (scheduleKey(before.schedule) !== scheduleKey(after.schedule))
    parts.push(
      `schedule: ${describeSchedule(before.schedule) ?? 'every day'} → ${
        describeSchedule(after.schedule) ?? 'every day'
      }`,
    )
  // Times only matter when they cross a time-of-day bucket (Morning/Afternoon/
  // Night) — comparing the bucket SET ignores within-bucket shifts and reorder.
  const beforeBuckets = timeOfDayBuckets(before.times)
  const afterBuckets = timeOfDayBuckets(after.times)
  if (beforeBuckets.join(',') !== afterBuckets.join(','))
    parts.push(
      `time of day: ${fmtBuckets(beforeBuckets)} → ${fmtBuckets(afterBuckets)}`,
    )
  return parts.length > 0 ? parts.join('; ') : null
}

function fmtBuckets(buckets: TimeOfDay[]): string {
  return buckets.length > 0
    ? buckets.map((bucket) => TIME_OF_DAY_LABELS[bucket]).join(', ')
    : 'none'
}

// Whether any persisted item field differs — INCLUDING the non-marker ones
// (name, type, groups, note). Used so an organizational-only edit still saves
// even though it records no StackEvent. Group order is ignored (set compare;
// JSON.stringify of the sorted list avoids separator-collision ambiguity).
function inputDiffers(before: StackItemInput, after: StackItemInput): boolean {
  const groupKey = (groups: string[] | undefined) =>
    JSON.stringify((groups ?? []).toSorted())
  return (
    before.name !== after.name ||
    before.kind !== after.kind ||
    before.dose !== after.dose ||
    (before.unit ?? '') !== (after.unit ?? '') ||
    (before.note ?? '') !== (after.note ?? '') ||
    before.times.join(',') !== after.times.join(',') ||
    groupKey(before.groups) !== groupKey(after.groups) ||
    scheduleKey(before.schedule) !== scheduleKey(after.schedule)
  )
}

// Adds an item and records its 'added' event. Returns the new item id.
export async function addItem(input: StackItemInput): Promise<number> {
  const item = normalizeInput(input)
  // Anchor the runway projection (#27): use the date the user gave, else today.
  const quantityAsOf =
    item.quantityOnHand === undefined
      ? undefined
      : (item.quantityAsOf ?? toIsoDate(new Date()))
  return db.transaction('rw', db.items, db.stackEvents, async () => {
    const uid = newUid()
    const stamp = nowIso()
    const id = await db.items.add({
      ...item,
      quantityAsOf,
      uid,
      status: 'active',
      createdAt: stamp,
      updatedAt: stamp,
    })
    await recordEvent(id, uid, item, 'added', 'added to stack')
    return id
  })
}

// Applies edits and records one 'changed' event ONLY when something marker-
// worthy changed (dose, dose-unit, schedule, time-of-day bucket — see
// buildChangeSummary). Organizational edits (name, type, group membership, the
// persistent note) and inventory fields (#27) persist but record no event /
// graph marker — like intakes and reorder, they aren't stack changes. A true
// no-op (no persisted field changed at all) writes nothing.
export async function updateItem(
  id: number,
  input: StackItemInput,
): Promise<void> {
  const after = normalizeInput(input)
  await db.transaction('rw', db.items, db.stackEvents, async () => {
    const existing = await mustGetItem(id)
    // Editable fields only — inventory (quantity*/unitsPerDose) is compared
    // separately via inventoryChanged below and isn't read by inputDiffers.
    const before: StackItemInput = {
      name: existing.name,
      kind: existing.kind,
      dose: existing.dose,
      unit: existing.unit,
      times: existing.times,
      groups: existing.groups,
      schedule: existing.schedule,
      note: existing.note,
    }
    const summary = buildChangeSummary(before, after)

    // Runway anchor (#27): the form round-trips the existing date, so the
    // user controls it — use what they submitted, defaulting to today only
    // when a count exists with no date. Cleared when the count is removed.
    const quantityAsOf =
      after.quantityOnHand === undefined
        ? undefined
        : (after.quantityAsOf ?? toIsoDate(new Date()))
    const inventoryChanged =
      after.quantityOnHand !== existing.quantityOnHand ||
      after.unitsPerDose !== existing.unitsPerDose ||
      quantityAsOf !== existing.quantityAsOf

    // Save when ANY persisted field changed (incl. non-marker ones) or
    // inventory moved; if literally nothing changed it's a true no-op.
    if (!inputDiffers(before, after) && !inventoryChanged) return

    // put (full replace) instead of update: Dexie's UpdateSpec typing does
    // not accept plain array properties like `times`
    await db.items.put({
      ...existing,
      ...after,
      quantityAsOf,
      updatedAt: nowIso(),
    })
    // Only a marker-worthy change records a StackEvent; organizational- and
    // inventory-only edits save silently (see updateItem doc above).
    if (summary !== null) {
      await recordEvent(id, existing.uid, after, 'changed', summary)
    }
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

// Restores an archived item; counts as 'added' again for the history. Clears
// any stale custom-sort order (#38) so the item re-enters UNRANKED — it falls
// to the end of the Custom list like a freshly added item, instead of keeping
// an old rank that would now collide with a since-reordered list. (Dexie's
// update drops a key whose value is undefined; order is unindexed, so safe.)
export async function unarchiveItem(id: number): Promise<void> {
  await db.transaction('rw', db.items, db.stackEvents, async () => {
    const item = await mustGetItem(id)
    await db.items.update(id, {
      status: 'active',
      order: undefined,
      todayOrder: undefined,
      updatedAt: nowIso(),
    })
    await recordEvent(id, item.uid, item, 'added', 're-added to stack')
  })
}

// Attaches (or clears) the user's "why" note on stack-change events. The
// Graphs list edits a whole row at once and a row may collapse several
// same-day changes into one (e.g. "Started Testosterone Support (2 items)"),
// so the note is shared: every underlying event id is written together. Empty
// text clears the note. Refreshes updatedAt so the edit propagates — stackEvents
// are otherwise append-only history, and merge takes the newest copy per uid.
// This is NOT a stack change itself: it edits existing events, records no new
// StackEvent, and never touches the immutable snapshot fields.
export async function setEventNote(
  eventIds: number[],
  note: string,
): Promise<void> {
  const value = note.trim() || undefined
  const stamp = nowIso()
  await db.transaction('rw', db.stackEvents, async () => {
    for (const id of eventIds) {
      const event = await db.stackEvents.get(id)
      if (!event) continue
      await db.stackEvents.put({ ...event, note: value, updatedAt: stamp })
    }
  })
}

// Persists the custom manual sort order (backlog #38). `orderedIds` is the
// active items in their new top-to-bottom order; each gets a dense rank
// (0, 1, 2, …) so later-added items (order undefined) fall to the end. Skips
// items already at their rank to keep sync deltas minimal. Reordering is NOT a
// stack change — it records no StackEvent/graph marker (like intakes/inventory)
// — but it bumps updatedAt so the order rides merge/sync (newest per item wins).
export async function reorderItems(orderedIds: number[]): Promise<void> {
  const stamp = nowIso()
  await db.transaction('rw', db.items, async () => {
    for (let rank = 0; rank < orderedIds.length; rank++) {
      const item = await db.items.get(orderedIds[rank])
      if (!item || item.order === rank) continue
      await db.items.update(orderedIds[rank], { order: rank, updatedAt: stamp })
    }
  })
}

// Persists the manual order for ONE Today time section (backlog #38b). `time`
// is the section's 'HH:mm'; `orderedIds` is that section's active items in
// their new top-to-bottom order, each given a dense rank under todayOrder[time].
// Independent per section: writing 08:00 leaves an item's 20:00 rank untouched
// (the existing map is spread, only this key is set). Skips items already at
// their rank to keep sync deltas minimal. Like reorderItems, this is NOT a
// stack change — no StackEvent — but bumps updatedAt so the order rides
// merge/sync (newest per item wins).
export async function reorderTodaySection(
  time: string,
  orderedIds: number[],
): Promise<void> {
  const stamp = nowIso()
  await db.transaction('rw', db.items, async () => {
    for (let rank = 0; rank < orderedIds.length; rank++) {
      const item = await db.items.get(orderedIds[rank])
      if (!item || item.todayOrder?.[time] === rank) continue
      await db.items.update(orderedIds[rank], {
        todayOrder: { ...item.todayOrder, [time]: rank },
        updatedAt: stamp,
      })
    }
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
