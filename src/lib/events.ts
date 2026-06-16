// src/lib/events.ts — shared presentation constants for health events
// (used by the Today events form and the Graphs legend). No state, no I/O.
import type { EventCategory } from '../db/db'

// Display labels, in the order categories are offered in the form select.
export const CATEGORY_LABELS: Record<EventCategory, string> = {
  symptom: 'Symptom',
  appointment: 'Appointment',
  procedure: 'Procedure',
  other: 'Other',
}

export const CATEGORY_ORDER = Object.keys(CATEGORY_LABELS) as EventCategory[]
