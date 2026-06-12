// tests/intakeRepository.test.ts — behavior tests for daily tracking writes:
// intake marking (taken/untaken, no duplicates, date scoping) and per-item
// daily notes (one per item+date, empty text clears).
import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '../src/db/db'
import { markTaken, unmarkTaken } from '../src/db/intakeRepository'
import { setItemNote } from '../src/db/itemNoteRepository'

const ITEM_ID = 1
const TODAY = '2026-06-11'
const YESTERDAY = '2026-06-10'

beforeEach(async () => {
  await db.intakes.clear()
  await db.itemNotes.clear()
})

describe('markTaken / unmarkTaken', () => {
  it('records one intake for the slot, even when marked twice', async () => {
    await markTaken(ITEM_ID, TODAY, '08:00')
    await markTaken(ITEM_ID, TODAY, '08:00')

    expect(await db.intakes.count()).toBe(1)
    const intake = (await db.intakes.toArray())[0]
    expect(intake).toMatchObject({
      itemId: ITEM_ID,
      date: TODAY,
      time: '08:00',
    })
  })

  it('tracks the same item separately per time slot', async () => {
    await markTaken(ITEM_ID, TODAY, '08:00')
    await markTaken(ITEM_ID, TODAY, '20:00')

    expect(await db.intakes.count()).toBe(2)
  })

  it('unmark removes only the matching slot and day', async () => {
    await markTaken(ITEM_ID, TODAY, '08:00')
    await markTaken(ITEM_ID, YESTERDAY, '08:00')

    await unmarkTaken(ITEM_ID, TODAY, '08:00')

    const remaining = await db.intakes.toArray()
    expect(remaining).toHaveLength(1)
    expect(remaining[0].date).toBe(YESTERDAY)
  })

  it('unmarking an unmarked slot is a harmless no-op', async () => {
    await unmarkTaken(ITEM_ID, TODAY, '08:00')
    expect(await db.intakes.count()).toBe(0)
  })
})

describe('setItemNote', () => {
  it('creates a note, then replaces it on the same day', async () => {
    await setItemNote(ITEM_ID, TODAY, 'ran out of pills')
    await setItemNote(ITEM_ID, TODAY, 'ordered more')

    const notes = await db.itemNotes.toArray()
    expect(notes).toHaveLength(1)
    expect(notes[0].text).toBe('ordered more')
  })

  it('keeps notes on different days separate', async () => {
    await setItemNote(ITEM_ID, YESTERDAY, 'felt off')
    await setItemNote(ITEM_ID, TODAY, 'better today')

    expect(await db.itemNotes.count()).toBe(2)
  })

  it('clears the note when text is empty or whitespace', async () => {
    await setItemNote(ITEM_ID, TODAY, 'ran out of pills')
    await setItemNote(ITEM_ID, TODAY, '   ')

    expect(await db.itemNotes.count()).toBe(0)
  })
})
