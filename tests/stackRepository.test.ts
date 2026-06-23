// tests/stackRepository.test.ts — behavior tests for the stack write path.
// The invariant under test: every mutation records exactly the right
// StackEvent (with name/group snapshots), and no-op edits record nothing.
// IndexedDB is simulated by fake-indexeddb (loaded in tests/setup.ts).
import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '../src/db/db'
import {
  addItem,
  archiveItem,
  buildChangeSummary,
  reorderItems,
  setEventNote,
  unarchiveItem,
  updateItem,
  type StackItemInput,
} from '../src/db/stackRepository'
import { toIsoDate } from '../src/lib/dates'

const ZINC: StackItemInput = {
  name: 'Zinc',
  kind: 'supplement',
  dose: '25 mg',
  times: ['08:00'],
  groups: ['Testosterone Support'],
}

beforeEach(async () => {
  await db.items.clear()
  await db.stackEvents.clear()
})

describe('addItem', () => {
  it('creates an active item and one added event with snapshots', async () => {
    const id = await addItem(ZINC)

    const item = await db.items.get(id)
    expect(item).toMatchObject({ name: 'Zinc', status: 'active' })

    const events = await db.stackEvents.toArray()
    expect(events).toHaveLength(1)
    expect(events[0]).toMatchObject({
      itemId: id,
      type: 'added',
      itemName: 'Zinc',
      groups: ['Testosterone Support'],
      date: toIsoDate(new Date()),
    })
  })

  it('sorts and deduplicates schedule times', async () => {
    const id = await addItem({ ...ZINC, times: ['20:00', '08:00', '20:00'] })
    const item = await db.items.get(id)
    expect(item?.times).toEqual(['08:00', '20:00'])
  })
})

describe('updateItem', () => {
  it('records a changed event describing the change', async () => {
    const id = await addItem(ZINC)
    await updateItem(id, { ...ZINC, dose: '50 mg' })

    const item = await db.items.get(id)
    expect(item?.dose).toBe('50 mg')

    const changed = await db.stackEvents
      .where('type')
      .equals('changed')
      .toArray()
    expect(changed).toHaveLength(1)
    expect(changed[0].summary).toBe('dose: 25 mg → 50 mg')
  })

  it('records no event when nothing effectively changed', async () => {
    const id = await addItem(ZINC)
    // same values, modulo whitespace and time order — still a no-op
    await updateItem(id, { ...ZINC, name: ' Zinc ', times: ['08:00'] })

    expect(await db.stackEvents.count()).toBe(1) // only the original 'added'
  })
})

describe('archiveItem / unarchiveItem', () => {
  it('archives with a removed event, never deletes', async () => {
    const id = await addItem(ZINC)
    await archiveItem(id)

    const item = await db.items.get(id)
    expect(item?.status).toBe('archived')

    const removed = await db.stackEvents
      .where('type')
      .equals('removed')
      .toArray()
    expect(removed).toHaveLength(1)
    expect(removed[0].itemName).toBe('Zinc')
  })

  it('restores with a fresh added event', async () => {
    const id = await addItem(ZINC)
    await archiveItem(id)
    await unarchiveItem(id)

    const item = await db.items.get(id)
    expect(item?.status).toBe('active')

    const added = await db.stackEvents.where('type').equals('added').toArray()
    expect(added).toHaveLength(2)
    expect(added[1].summary).toBe('re-added to stack')
  })
})

describe('refill runway inventory (#27)', () => {
  const today = toIsoDate(new Date())

  it('stamps quantityAsOf and normalizes units on add', async () => {
    const id = await addItem({
      ...ZINC,
      quantityOnHand: 60,
      unitsPerDose: 2,
    })
    expect(await db.items.get(id)).toMatchObject({
      quantityOnHand: 60,
      quantityAsOf: today,
      unitsPerDose: 2,
    })
  })

  it('collapses a units-per-dose of 1 to undefined (the default)', async () => {
    const id = await addItem({ ...ZINC, quantityOnHand: 30, unitsPerDose: 1 })
    expect((await db.items.get(id))?.unitsPerDose).toBeUndefined()
  })

  it('preserves a user-supplied past anchor instead of stamping today', async () => {
    const id = await addItem({
      ...ZINC,
      quantityOnHand: 28,
      quantityAsOf: '2026-06-05',
    })
    expect((await db.items.get(id))?.quantityAsOf).toBe('2026-06-05')
  })

  it('treats back-dating an existing count as an inventory edit (no marker)', async () => {
    const id = await addItem({ ...ZINC, quantityOnHand: 28 })
    await updateItem(id, {
      ...ZINC,
      quantityOnHand: 28,
      quantityAsOf: '2026-06-05',
    })
    expect((await db.items.get(id))?.quantityAsOf).toBe('2026-06-05')
    expect(await db.stackEvents.count()).toBe(1) // only the original 'added'
  })

  it('persists an inventory-only edit WITHOUT a stack event/marker', async () => {
    const id = await addItem(ZINC)
    await updateItem(id, { ...ZINC, quantityOnHand: 90 })

    expect((await db.items.get(id))?.quantityOnHand).toBe(90)
    expect((await db.items.get(id))?.quantityAsOf).toBe(today)
    // no 'changed' event — refilling is inventory, not a stack change
    expect(await db.stackEvents.count()).toBe(1) // only the original 'added'
  })

  it('still records a marker when a real field changes alongside the count', async () => {
    const id = await addItem(ZINC)
    await updateItem(id, { ...ZINC, dose: '50 mg', quantityOnHand: 90 })

    expect((await db.items.get(id))?.quantityOnHand).toBe(90)
    const changed = await db.stackEvents
      .where('type')
      .equals('changed')
      .toArray()
    expect(changed).toHaveLength(1)
    expect(changed[0].summary).toBe('dose: 25 mg → 50 mg')
  })

  it('clears the anchor when the count is removed', async () => {
    const id = await addItem({ ...ZINC, quantityOnHand: 30 })
    await updateItem(id, { ...ZINC, quantityOnHand: undefined })
    const item = await db.items.get(id)
    expect(item?.quantityOnHand).toBeUndefined()
    expect(item?.quantityAsOf).toBeUndefined()
  })
})

describe('buildChangeSummary', () => {
  it('lists every changed field', () => {
    const summary = buildChangeSummary(ZINC, {
      ...ZINC,
      dose: '50 mg',
      times: ['08:00', '20:00'],
      groups: [],
    })
    expect(summary).toBe(
      'dose: 25 mg → 50 mg; times: 08:00 → 08:00, 20:00; groups: Testosterone Support → none',
    )
  })

  it('reports unit changes and flags note edits without dumping the text', () => {
    const summary = buildChangeSummary(ZINC, {
      ...ZINC,
      unit: 'mcg',
      note: 'take with food',
    })
    expect(summary).toBe('unit: none → mcg; note updated')
  })

  it('describes a frequency change in plain English', () => {
    const summary = buildChangeSummary(ZINC, {
      ...ZINC,
      schedule: { kind: 'everyNDays', n: 2, startDate: '2026-06-18' },
    })
    expect(summary).toBe('schedule: every day → Every other day')
  })

  it('returns null when nothing changed', () => {
    expect(buildChangeSummary(ZINC, { ...ZINC })).toBeNull()
  })
})

describe('schedule normalization', () => {
  it('collapses degenerate schedules to every-day (undefined)', async () => {
    // n:1, a full 7-day week, and a zero off-period all mean "every day".
    const id = await addItem({
      ...ZINC,
      schedule: { kind: 'everyNDays', n: 1, startDate: '2026-06-18' },
    })
    expect((await db.items.get(id))?.schedule).toBeUndefined()

    await updateItem(id, {
      ...ZINC,
      schedule: { kind: 'daysOfWeek', days: [0, 1, 2, 3, 4, 5, 6] },
    })
    expect((await db.items.get(id))?.schedule).toBeUndefined()
  })

  it('persists and dedupes a real schedule', async () => {
    const id = await addItem({
      ...ZINC,
      schedule: { kind: 'daysOfWeek', days: [5, 1, 1, 3] },
    })
    expect((await db.items.get(id))?.schedule).toEqual({
      kind: 'daysOfWeek',
      days: [1, 3, 5],
    })
  })
})

describe('reorderItems', () => {
  it('writes a dense rank in the given order and bumps updatedAt', async () => {
    const zinc = await addItem({ ...ZINC, name: 'Zinc' })
    const boron = await addItem({ ...ZINC, name: 'Boron' })
    const iron = await addItem({ ...ZINC, name: 'Iron' })
    const before = (await db.items.get(boron))!.updatedAt

    // New top-to-bottom order: Boron, Iron, Zinc
    await reorderItems([boron, iron, zinc])

    expect((await db.items.get(boron))?.order).toBe(0)
    expect((await db.items.get(iron))?.order).toBe(1)
    expect((await db.items.get(zinc))?.order).toBe(2)
    expect((await db.items.get(boron))!.updatedAt >= before).toBe(true)
  })

  it('records no stack event — reordering is not a stack change', async () => {
    const a = await addItem({ ...ZINC, name: 'A' })
    const b = await addItem({ ...ZINC, name: 'B' })
    const eventsBefore = await db.stackEvents.count()

    await reorderItems([b, a])

    expect(await db.stackEvents.count()).toBe(eventsBefore) // no marker
  })

  it('skips items already at their rank (no needless updatedAt churn)', async () => {
    const a = await addItem({ ...ZINC, name: 'A' })
    const b = await addItem({ ...ZINC, name: 'B' })
    await reorderItems([a, b]) // a→0, b→1
    const aStamp = (await db.items.get(a))!.updatedAt

    await reorderItems([a, b]) // identical order → no writes
    expect((await db.items.get(a))!.updatedAt).toBe(aStamp)
  })

  it('ignores ids with no matching item', async () => {
    const a = await addItem({ ...ZINC, name: 'A' })
    await expect(reorderItems([9999, a])).resolves.toBeUndefined()
    expect((await db.items.get(a))?.order).toBe(1) // ranked by position
  })

  it('clears order on unarchive so a restored item re-enters unranked', async () => {
    const a = await addItem({ ...ZINC, name: 'A' })
    const b = await addItem({ ...ZINC, name: 'B' })
    await reorderItems([a, b]) // A→0, B→1
    await archiveItem(b)
    await reorderItems([a]) // A→0; B keeps its stale rank 1 while archived
    await unarchiveItem(b)
    // B returns unranked (not a duplicate rank 1) → sorts to the end by name
    expect((await db.items.get(b))?.order).toBeUndefined()
  })
})

describe('setEventNote', () => {
  it('attaches a note and refreshes updatedAt without a new event', async () => {
    await addItem(ZINC)
    const event = (await db.stackEvents.toArray())[0]
    const before = event.updatedAt

    await setEventNote([event.id], '  after bloodwork  ')

    const updated = await db.stackEvents.get(event.id)
    if (!updated) throw new Error('event missing after note write')
    expect(updated.note).toBe('after bloodwork') // trimmed
    expect(updated.updatedAt >= before).toBe(true) // bumped for sync
    expect(await db.stackEvents.count()).toBe(1) // edits an event, adds none
  })

  it('shares one note across every event id in a collapsed row', async () => {
    await addItem(ZINC) // Testosterone Support
    await addItem({ ...ZINC, name: 'Magnesium' }) // same group, same day
    const ids = (await db.stackEvents.toArray()).map((e) => e.id)

    await setEventNote(ids, 'started the stack')

    const notes = (await db.stackEvents.toArray()).map((e) => e.note)
    expect(notes).toEqual(['started the stack', 'started the stack'])
  })

  it('clears the note when given empty (or whitespace) text', async () => {
    await addItem(ZINC)
    const id = (await db.stackEvents.toArray())[0].id
    await setEventNote([id], 'temporary')
    await setEventNote([id], '   ')
    expect((await db.stackEvents.get(id))?.note).toBeUndefined()
  })

  it('ignores ids with no matching event', async () => {
    await expect(setEventNote([9999], 'orphan')).resolves.toBeUndefined()
    expect(await db.stackEvents.count()).toBe(0)
  })
})
