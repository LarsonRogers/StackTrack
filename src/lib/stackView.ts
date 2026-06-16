// src/lib/stackView.ts — pure view-shaping helpers for the Stack screen.
// No state, no db access.
import type { StackEvent, StackItem } from '../db/db'

export type StackSortMode = 'group' | 'name' | 'time' | 'recent'

export const SORT_MODE_LABELS: Record<StackSortMode, string> = {
  group: 'Group',
  name: 'Name',
  time: 'Time of day',
  recent: 'Recently changed',
}

export interface GroupSection {
  group: string | null // null = ungrouped, always displayed last
  items: StackItem[]
}

// Groups items by purpose group: sections alphabetical, items alphabetical,
// ungrouped items in a trailing null section. An item in multiple groups
// appears in EACH of its sections (the screen marks it as multi-group so it
// reads as one item, not duplicates).
export function groupByPurpose(items: StackItem[]): GroupSection[] {
  const byGroup = new Map<string | null, StackItem[]>()
  const add = (key: string | null, item: StackItem) => {
    const section = byGroup.get(key) ?? []
    section.push(item)
    byGroup.set(key, section)
  }
  for (const item of items) {
    if (item.groups.length === 0) add(null, item)
    else for (const group of item.groups) add(group, item)
  }

  const sections = [...byGroup.entries()].map(([group, groupItems]) => ({
    group,
    items: groupItems.toSorted((a, b) => a.name.localeCompare(b.name)),
  }))

  return sections.toSorted((a, b) => {
    if (a.group === null) return 1
    if (b.group === null) return -1
    return a.group.localeCompare(b.group)
  })
}

export function sortByName(items: StackItem[]): StackItem[] {
  return items.toSorted((a, b) => a.name.localeCompare(b.name))
}

// Earliest scheduled time first (times are stored sorted, so times[0] is
// each item's earliest), ties broken by name.
export function sortByEarliestTime(items: StackItem[]): StackItem[] {
  return items.toSorted(
    (a, b) =>
      (a.times[0] ?? '').localeCompare(b.times[0] ?? '') ||
      a.name.localeCompare(b.name),
  )
}

// Latest event date per item — feeds the "recently changed" sort.
// Every item has at least its 'added' event, so the fallback '' is
// defensive only.
export function latestEventDates(events: StackEvent[]): Map<number, string> {
  const latest = new Map<number, string>()
  for (const event of events) {
    const current = latest.get(event.itemId)
    if (!current || event.date > current) latest.set(event.itemId, event.date)
  }
  return latest
}

// Most recently changed first (event dates are day-granular; same-day ties
// break by name).
export function sortByRecentlyChanged(
  items: StackItem[],
  lastEventDateByItem: Map<number, string>,
): StackItem[] {
  return items.toSorted(
    (a, b) =>
      (lastEventDateByItem.get(b.id) ?? '').localeCompare(
        lastEventDateByItem.get(a.id) ?? '',
      ) || a.name.localeCompare(b.name),
  )
}

// Distinct group names across items (for the form's suggestions), sorted.
export function distinctGroups(items: StackItem[]): string[] {
  const groups = new Set<string>()
  for (const item of items) {
    for (const group of item.groups) if (group) groups.add(group)
  }
  return [...groups].sort()
}
