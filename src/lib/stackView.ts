// src/lib/stackView.ts — pure view-shaping helpers for the Stack screen.
// No state, no db access.
import type { StackItem } from '../db/db'

export interface GroupSection {
  group: string | null // null = ungrouped, always displayed last
  items: StackItem[]
}

// Groups items by purpose group: sections alphabetical, items alphabetical,
// ungrouped items in a trailing null section.
export function groupByPurpose(items: StackItem[]): GroupSection[] {
  const byGroup = new Map<string | null, StackItem[]>()
  for (const item of items) {
    const key = item.group ?? null
    const section = byGroup.get(key) ?? []
    section.push(item)
    byGroup.set(key, section)
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

// Distinct group names across items (for the form's suggestions), sorted.
export function distinctGroups(items: StackItem[]): string[] {
  const groups = new Set<string>()
  for (const item of items) {
    if (item.group) groups.add(item.group)
  }
  return [...groups].sort()
}
