// tests/groupsMigration.test.ts — proves the schema v8 groups migration is
// LOSSLESS: the legacy single `group` field is carried onto `groups: string[]`
// for items and stackEvents, and NOTHING else on any record is touched. Also
// covers import/merge of pre-v8 backups (which still carry `group`).
import { beforeEach, describe, expect, it } from 'vitest'
import { db, migrateGroups, normalizeGroupsField } from '../src/db/db'
import { applyBundle, parseBundle } from '../src/lib/importData'
import { mergeBundle } from '../src/lib/mergeData'

async function clearAll() {
  await db.items.clear()
  await db.stackEvents.clear()
  await db.intakes.clear()
  await db.itemNotes.clear()
  await db.metrics.clear()
  await db.metricEntries.clear()
  await db.dayNotes.clear()
  await db.tombstones.clear()
}

beforeEach(clearAll)

describe('normalizeGroupsField', () => {
  it('carries a single group onto a one-element groups array', () => {
    const row = { group: 'Bone' } as Record<string, unknown>
    expect(normalizeGroupsField(row)).toBe(true)
    expect(row.groups).toEqual(['Bone'])
    expect('group' in row).toBe(false)
  })

  it('maps a missing or blank group to an empty array', () => {
    const none = {} as Record<string, unknown>
    normalizeGroupsField(none)
    expect(none.groups).toEqual([])

    const blank = { group: '   ' } as Record<string, unknown>
    normalizeGroupsField(blank)
    expect(blank.groups).toEqual([])
  })

  it('keeps an existing groups array and only strips a stray group', () => {
    const row = { groups: ['A', 'B'], group: 'A' } as Record<string, unknown>
    normalizeGroupsField(row)
    expect(row.groups).toEqual(['A', 'B'])
    expect('group' in row).toBe(false)
  })

  it('is idempotent — a second pass changes nothing', () => {
    const row = { group: 'Bone' } as Record<string, unknown>
    normalizeGroupsField(row)
    expect(normalizeGroupsField(row)).toBe(false)
    expect(row.groups).toEqual(['Bone'])
  })
})

describe('migrateGroups — lossless v8 upgrade', () => {
  it('converts group→groups on items and stackEvents and touches nothing else', async () => {
    // A legacy (pre-v8) item: full record shape, single `group`, no `groups`.
    const legacyItem = {
      uid: 'item-uid-1',
      name: 'Vitamin D',
      kind: 'supplement',
      dose: '2000 IU',
      times: ['08:00', '20:00'],
      group: 'Bone',
      status: 'active',
      createdAt: '2026-06-01T08:00:00.000Z',
      updatedAt: '2026-06-01T08:00:00.000Z',
    }
    const legacyUngrouped = {
      uid: 'item-uid-2',
      name: 'Creatine',
      kind: 'supplement',
      dose: '5 g',
      times: ['09:00'],
      status: 'active',
      createdAt: '2026-06-02T08:00:00.000Z',
      updatedAt: '2026-06-02T08:00:00.000Z',
    }
    const legacyEvent = {
      uid: 'event-uid-1',
      itemId: 1,
      itemUid: 'item-uid-1',
      date: '2026-06-01',
      type: 'added',
      itemName: 'Vitamin D',
      group: 'Bone',
      summary: 'added to stack',
      updatedAt: '2026-06-01T08:00:00.000Z',
    }
    await db.table('items').bulkAdd([legacyItem, legacyUngrouped])
    await db.table('stackEvents').bulkAdd([legacyEvent])

    await migrateGroups(db)

    const [vitD, creatine] = (await db.items
      .orderBy('uid')
      .toArray()) as unknown as Record<string, unknown>[]
    const event = (await db.stackEvents.toArray())[0] as unknown as Record<
      string,
      unknown
    >

    // groups carried over correctly
    expect(vitD.groups).toEqual(['Bone'])
    expect(creatine.groups).toEqual([])
    expect(event.groups).toEqual(['Bone'])
    // legacy field gone
    expect('group' in vitD).toBe(false)
    expect('group' in event).toBe(false)
    // EVERY other field is byte-identical to what was stored
    for (const key of Object.keys(legacyItem)) {
      if (key === 'group') continue
      expect(vitD[key]).toEqual((legacyItem as Record<string, unknown>)[key])
    }
    for (const key of Object.keys(legacyEvent)) {
      if (key === 'group') continue
      expect(event[key]).toEqual((legacyEvent as Record<string, unknown>)[key])
    }
  })

  it('is idempotent — re-running after upgrade is a no-op', async () => {
    await db.table('items').bulkAdd([
      {
        uid: 'item-uid-1',
        name: 'Zinc',
        kind: 'supplement',
        dose: '25 mg',
        times: ['08:00'],
        group: 'Immune',
        status: 'active',
        createdAt: '2026-06-01T08:00:00.000Z',
        updatedAt: '2026-06-01T08:00:00.000Z',
      },
    ])
    await migrateGroups(db)
    const first = await db.items.toArray()
    await migrateGroups(db)
    const second = await db.items.toArray()
    expect(second).toEqual(first)
  })
})

describe('pre-v8 backups load with groups', () => {
  const legacyBundle = () =>
    JSON.stringify({
      app: 'StackTrack',
      schemaVersion: 7,
      exportedAt: '2026-06-12T00:00:00.000Z',
      data: {
        items: [
          {
            id: 1,
            uid: 'item-uid-1',
            name: 'Vitamin D',
            kind: 'supplement',
            dose: '2000 IU',
            times: ['08:00'],
            group: 'Bone',
            status: 'active',
            createdAt: '2026-06-01T08:00:00.000Z',
            updatedAt: '2026-06-01T08:00:00.000Z',
          },
        ],
        stackEvents: [
          {
            id: 1,
            uid: 'event-uid-1',
            itemId: 1,
            itemUid: 'item-uid-1',
            date: '2026-06-01',
            type: 'added',
            itemName: 'Vitamin D',
            group: 'Bone',
            summary: 'added to stack',
            updatedAt: '2026-06-01T08:00:00.000Z',
          },
        ],
      },
    })

  it('import (replace) normalizes group→groups', async () => {
    await applyBundle(parseBundle(legacyBundle()))
    const item = (await db.items.toArray())[0] as unknown as Record<
      string,
      unknown
    >
    const event = (await db.stackEvents.toArray())[0] as unknown as Record<
      string,
      unknown
    >
    expect(item.groups).toEqual(['Bone'])
    expect('group' in item).toBe(false)
    expect(event.groups).toEqual(['Bone'])
    expect(item.dose).toBe('2000 IU') // other data intact
  })

  it('merge (sync from file) normalizes group→groups', async () => {
    const summary = await mergeBundle(parseBundle(legacyBundle()), true)
    expect(summary.added).toBeGreaterThan(0)
    const item = (await db.items.toArray())[0] as unknown as Record<
      string,
      unknown
    >
    expect(item.groups).toEqual(['Bone'])
    expect('group' in item).toBe(false)
  })
})
