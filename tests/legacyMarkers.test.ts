// tests/legacyMarkers.test.ts — pure classification of obsolete historical
// stack-change markers (#cleanup): which 'changed' events would NOT be recorded
// under the current rules. Strong bias toward KEEPING — unrecognized summaries
// and annotated events are always kept.
import { describe, expect, it } from 'vitest'
import type { StackEvent, StackEventType } from '../src/db/db'
import {
  findObsoleteStackEvents,
  isObsoleteChangeEvent,
} from '../src/lib/legacyMarkers'

let nextId = 1
function event(
  summary: string,
  opts: { type?: StackEventType; note?: string } = {},
): StackEvent {
  const id = nextId++
  return {
    id,
    uid: `evt-${id}`,
    itemId: 1,
    itemUid: 'item-1',
    date: '2026-06-01',
    type: opts.type ?? 'changed',
    itemName: 'Zinc',
    groups: [],
    summary,
    note: opts.note,
    updatedAt: '2026-06-01T12:00:00.000Z',
  }
}

describe('isObsoleteChangeEvent — obsolete (deletable)', () => {
  it('group-only change', () => {
    expect(
      isObsoleteChangeEvent(event('groups: Testosterone Support → none')),
    ).toBe(true)
  })

  it('earliest-version singular "group:" change', () => {
    expect(isObsoleteChangeEvent(event('group: Sleep → none'))).toBe(true)
  })

  it('name-only, type-only, and note-only changes', () => {
    expect(isObsoleteChangeEvent(event('name: Zinc → Zinc Picolinate'))).toBe(
      true,
    )
    expect(isObsoleteChangeEvent(event('type: supplement → med'))).toBe(true)
    expect(isObsoleteChangeEvent(event('note updated'))).toBe(true)
  })

  it('a within-bucket time change (08:00 → 09:00, both Morning)', () => {
    expect(isObsoleteChangeEvent(event('times: 08:00 → 09:00'))).toBe(true)
  })

  it('several obsolete parts combined', () => {
    expect(
      isObsoleteChangeEvent(
        event('name: A → B; groups: X → none; times: 08:00 → 10:00'),
      ),
    ).toBe(true)
  })
})

describe('isObsoleteChangeEvent — kept', () => {
  it('keeps dose, unit, and schedule changes', () => {
    expect(isObsoleteChangeEvent(event('dose: 25 mg → 50 mg'))).toBe(false)
    expect(isObsoleteChangeEvent(event('unit: none → mcg'))).toBe(false)
    expect(
      isObsoleteChangeEvent(event('schedule: every day → Every other day')),
    ).toBe(false)
  })

  it('keeps a time change that crosses a bucket (08:00 → 13:00)', () => {
    expect(isObsoleteChangeEvent(event('times: 08:00 → 13:00'))).toBe(false)
  })

  it('keeps when a marker-worthy part rides along with obsolete ones', () => {
    expect(
      isObsoleteChangeEvent(event('dose: 25 mg → 50 mg; groups: X → none')),
    ).toBe(false)
  })

  it('keeps current-format time-of-day markers', () => {
    expect(
      isObsoleteChangeEvent(event('time of day: Morning → Afternoon')),
    ).toBe(false)
  })

  it('keeps added / removed / re-added events', () => {
    expect(
      isObsoleteChangeEvent(event('added to stack', { type: 'added' })),
    ).toBe(false)
    expect(
      isObsoleteChangeEvent(event('removed from stack', { type: 'removed' })),
    ).toBe(false)
  })

  it('keeps an event the user annotated with a why-note', () => {
    expect(
      isObsoleteChangeEvent(event('groups: X → none', { note: 'reorganized' })),
    ).toBe(false)
  })

  it('keeps anything it does not recognize (conservative)', () => {
    expect(isObsoleteChangeEvent(event('frobnicated: yes'))).toBe(false)
    expect(isObsoleteChangeEvent(event(''))).toBe(false)
    // an unparseable times part keeps the event rather than guessing
    expect(isObsoleteChangeEvent(event('times: weird-format'))).toBe(false)
  })
})

describe('findObsoleteStackEvents', () => {
  it('returns only the obsolete events, in order', () => {
    const events = [
      event('dose: 25 mg → 50 mg'), // keep
      event('groups: X → none'), // obsolete
      event('added to stack', { type: 'added' }), // keep
      event('note updated'), // obsolete
    ]
    const obsolete = findObsoleteStackEvents(events)
    expect(obsolete.map((e) => e.summary)).toEqual([
      'groups: X → none',
      'note updated',
    ])
  })
})
