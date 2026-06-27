// src/lib/legacyMarkers.ts — pure logic for the one-time cleanup of historical
// stack-change markers that wouldn't be recorded under the current rules (see
// stackRepository.buildChangeSummary). A 'changed' StackEvent is OBSOLETE only
// when every part of its summary is a now-non-marker edit: group membership,
// rename, med↔supplement type, the persistent note, or a time tweak that stays
// within the same time-of-day bucket. No state, no I/O.
//
// Old events store only the summary STRING (not before/after values), so we
// classify by parsing it. The bias is strongly toward KEEPING: anything we
// don't clearly recognize as obsolete is kept, and an event the user annotated
// with a "why" note (#41) is always kept. A false keep leaves a harmless stray
// marker; a false delete would lose real history — so we never risk the latter.
import type { StackEvent } from '../db/db'
import { timeOfDayBuckets } from './schedule'

// Summary-part prefixes that are ALWAYS still marker-worthy → keep the event.
// 'time of day:' is included because the current code only emits it on a real
// bucket crossing (a within-bucket change records nothing).
const MARKER_PREFIXES = ['dose:', 'unit:', 'schedule:', 'time of day:']

// Prefixes recognized as no-longer-marker organizational edits. 'group:'
// (singular) is the earliest app version's format — it predates multi-group
// support; matching it lets the cleanup reach the oldest data too.
const OBSOLETE_PREFIXES = ['groups:', 'group:', 'name:', 'type:']

// The literal note-edit part the old buildChangeSummary emitted.
const NOTE_PART = 'note updated'

// Whether one summary part is an obsolete (non-marker) edit. A part we don't
// recognize returns false (→ keep the event), keeping the bias toward keeping.
function isObsoletePart(part: string): boolean {
  if (MARKER_PREFIXES.some((prefix) => part.startsWith(prefix))) return false
  if (part === NOTE_PART) return true
  if (OBSOLETE_PREFIXES.some((prefix) => part.startsWith(prefix))) return true
  // Legacy raw-time edit, e.g. "times: 08:00 → 09:00, 20:00". Obsolete only
  // when the set of time-of-day buckets is unchanged; a crossing is kept.
  if (part.startsWith('times:')) {
    const sides = part.slice('times:'.length).split(' → ')
    if (sides.length !== 2) return false // unparseable → keep
    const parseTimes = (s: string) =>
      s
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)
    const before = timeOfDayBuckets(parseTimes(sides[0]))
    const after = timeOfDayBuckets(parseTimes(sides[1]))
    return before.join(',') === after.join(',')
  }
  return false // unrecognized → keep
}

// Whether a single event is an obsolete 'changed' marker safe to remove. Only
// 'changed' events qualify (added/removed/re-added are always real); an event
// carrying a user "why" note is preserved; every summary part must be obsolete.
export function isObsoleteChangeEvent(event: StackEvent): boolean {
  if (event.type !== 'changed') return false
  if (event.note && event.note.trim()) return false
  const parts = (event.summary ?? '').split('; ').filter(Boolean)
  if (parts.length === 0) return false
  return parts.every(isObsoletePart)
}

// The events that the cleanup would remove, preserving input order.
export function findObsoleteStackEvents(events: StackEvent[]): StackEvent[] {
  return events.filter(isObsoleteChangeEvent)
}
