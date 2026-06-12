// src/lib/todayView.ts — pure view-shaping helpers for the Today screen.
// No state, no db access.
import type { StackItem } from '../db/db'

// One checklist row: an item due at one of its scheduled times.
export interface ChecklistEntry {
  item: StackItem
  time: string // 'HH:mm'
}

export interface TimeSection {
  time: string // 'HH:mm'
  entries: ChecklistEntry[]
}

// Expands active items into time-of-day sections: an item scheduled at
// 08:00 and 20:00 appears in both. Sections chronological ('HH:mm' strings
// sort correctly); items alphabetical within a section.
export function buildTimeSections(items: StackItem[]): TimeSection[] {
  const byTime = new Map<string, ChecklistEntry[]>()
  for (const item of items) {
    for (const time of item.times) {
      const entries = byTime.get(time) ?? []
      entries.push({ item, time })
      byTime.set(time, entries)
    }
  }

  return [...byTime.entries()]
    .map(([time, entries]) => ({
      time,
      entries: entries.toSorted((a, b) =>
        a.item.name.localeCompare(b.item.name),
      ),
    }))
    .toSorted((a, b) => a.time.localeCompare(b.time))
}
