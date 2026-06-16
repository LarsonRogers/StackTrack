// tests/healthEventRepository.test.ts — behavior tests for per-day health
// events: many per date, label trimming, edit, and delete-records-tombstone.
import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '../src/db/db'
import {
  addHealthEvent,
  deleteHealthEvent,
  updateHealthEvent,
} from '../src/db/healthEventRepository'

const TODAY = '2026-06-16'
const YESTERDAY = '2026-06-15'

beforeEach(async () => {
  await db.healthEvents.clear()
  await db.tombstones.clear()
})

describe('health events', () => {
  it('adds an event with a trimmed label and category', async () => {
    const id = await addHealthEvent(TODAY, '  Fever  ', 'symptom')
    expect(await db.healthEvents.get(id)).toMatchObject({
      date: TODAY,
      label: 'Fever',
      category: 'symptom',
    })
  })

  it('allows many events on the same day', async () => {
    await addHealthEvent(TODAY, 'Fever', 'symptom')
    await addHealthEvent(TODAY, 'GI Doc Appointment', 'appointment')
    expect(await db.healthEvents.where('date').equals(TODAY).count()).toBe(2)
  })

  it('keeps different days separate', async () => {
    await addHealthEvent(TODAY, 'Fever', 'symptom')
    await addHealthEvent(YESTERDAY, 'Headache', 'symptom')
    expect(await db.healthEvents.where('date').equals(TODAY).count()).toBe(1)
  })

  it('rejects an empty or whitespace label', async () => {
    await expect(addHealthEvent(TODAY, '   ', 'other')).rejects.toThrow(
      /needs a label/,
    )
  })

  it('updates label and category', async () => {
    const id = await addHealthEvent(TODAY, 'Appt', 'appointment')
    await updateHealthEvent(id, {
      label: 'Appendectomy',
      category: 'procedure',
    })
    expect(await db.healthEvents.get(id)).toMatchObject({
      label: 'Appendectomy',
      category: 'procedure',
    })
  })

  it('delete removes the event and records a tombstone', async () => {
    const id = await addHealthEvent(TODAY, 'Fever', 'symptom')
    const uid = (await db.healthEvents.get(id))!.uid

    await deleteHealthEvent(id)

    expect(await db.healthEvents.count()).toBe(0)
    expect(await db.tombstones.where('uid').equals(uid).count()).toBe(1)
  })
})
