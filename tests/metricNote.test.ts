// tests/metricNote.test.ts — behavior tests for per-metric daily notes
// (one per metric+date, replace on re-save, empty clears + tombstones) and
// the persistent note on the metric definition.
import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '../src/db/db'
import { addMetric, updateMetric } from '../src/db/metricRepository'
import { setMetricNote } from '../src/db/metricNoteRepository'

const TODAY = '2026-06-18'
const YESTERDAY = '2026-06-17'

beforeEach(async () => {
  await db.metrics.clear()
  await db.metricNotes.clear()
  await db.tombstones.clear()
})

describe('persistent metric note (definition)', () => {
  it('saves a note on creation', async () => {
    const id = await addMetric({
      name: 'Weight',
      kind: 'number',
      unit: 'kg',
      note: 'measured before coffee',
    })
    expect((await db.metrics.get(id))?.note).toBe('measured before coffee')
  })

  it('omits an empty note rather than storing blank text', async () => {
    const id = await addMetric({ name: 'Energy', kind: 'rating', note: '   ' })
    expect((await db.metrics.get(id))?.note).toBeUndefined()
  })

  it('updates and clears the note on edit', async () => {
    const id = await addMetric({ name: 'Energy', kind: 'rating', note: 'a.m.' })
    await updateMetric(id, { name: 'Energy', note: 'p.m.' })
    expect((await db.metrics.get(id))?.note).toBe('p.m.')

    await updateMetric(id, { name: 'Energy', note: '' })
    expect((await db.metrics.get(id))?.note).toBeUndefined()
  })
})

describe('per-day metric note', () => {
  it('creates a note carrying the metric uid', async () => {
    const id = await addMetric({ name: 'Weight', kind: 'number' })
    const metricUid = (await db.metrics.get(id))!.uid
    await setMetricNote(id, TODAY, 'after a run')

    const note = (await db.metricNotes.toArray())[0]
    expect(note).toMatchObject({ metricId: id, metricUid, date: TODAY })
    expect(note.text).toBe('after a run')
    expect(note.uid).toBeTruthy()
  })

  it('keeps one note per metric per day; re-saving replaces', async () => {
    const id = await addMetric({ name: 'Weight', kind: 'number' })
    await setMetricNote(id, TODAY, 'first')
    await setMetricNote(id, TODAY, 'second')

    const notes = await db.metricNotes.toArray()
    expect(notes).toHaveLength(1)
    expect(notes[0].text).toBe('second')
  })

  it('keeps different days separate', async () => {
    const id = await addMetric({ name: 'Weight', kind: 'number' })
    await setMetricNote(id, YESTERDAY, 'yesterday')
    await setMetricNote(id, TODAY, 'today')

    expect(await db.metricNotes.count()).toBe(2)
  })

  it('clears the note on empty text and records a tombstone', async () => {
    const id = await addMetric({ name: 'Weight', kind: 'number' })
    await setMetricNote(id, TODAY, 'temp')
    const uid = (await db.metricNotes.toArray())[0].uid

    await setMetricNote(id, TODAY, '   ')

    expect(await db.metricNotes.count()).toBe(0)
    expect(await db.tombstones.where('uid').equals(uid).count()).toBe(1)
  })

  it('does nothing (no tombstone) when clearing a non-existent note', async () => {
    const id = await addMetric({ name: 'Weight', kind: 'number' })
    await setMetricNote(id, TODAY, '')

    expect(await db.metricNotes.count()).toBe(0)
    expect(await db.tombstones.count()).toBe(0)
  })
})
