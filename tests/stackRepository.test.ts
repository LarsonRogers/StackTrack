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
  group: 'Testosterone Support',
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
      group: 'Testosterone Support',
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

describe('buildChangeSummary', () => {
  it('lists every changed field', () => {
    const summary = buildChangeSummary(ZINC, {
      ...ZINC,
      dose: '50 mg',
      times: ['08:00', '20:00'],
      group: undefined,
    })
    expect(summary).toBe(
      'dose: 25 mg → 50 mg; times: 08:00 → 08:00, 20:00; group: Testosterone Support → none',
    )
  })

  it('returns null when nothing changed', () => {
    expect(buildChangeSummary(ZINC, { ...ZINC })).toBeNull()
  })
})
