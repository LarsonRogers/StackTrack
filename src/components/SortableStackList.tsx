// src/components/SortableStackList.tsx — a vertical drag-to-reorder list built
// on dnd-kit. Shared by the Stack screen's Custom sort (backlog #38a) and one
// Today time section's Custom order (#38b, which passes today-* classes). Owns
// the DnD context + sensors only; rows render their body via renderBody, and
// persistence is delegated to onReorder (the caller writes through the
// repository). Pointer sensor with a small activation distance so a tap on the
// handle that doesn't move isn't treated as a drag; keyboard sensor for a11y.
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import type { ReactNode } from 'react'
import type { StackItem } from '../db/db'
import SortableStackItem from './SortableStackItem'

interface SortableStackListProps {
  items: StackItem[] // items in their current custom order
  onReorder: (orderedIds: number[]) => void
  renderBody: (item: StackItem) => ReactNode
  listClassName?: string // <ul> classes; defaults to the Stack list (#38a)
  itemClassName?: string // each <li>'s classes; passed through to the row
}

export default function SortableStackList({
  items,
  onReorder,
  renderBody,
  listClassName = 'stack-list stack-list-flat',
  itemClassName,
}: SortableStackListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )
  const ids = items.map((item) => item.id)

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = ids.indexOf(active.id as number)
    const newIndex = ids.indexOf(over.id as number)
    if (oldIndex === -1 || newIndex === -1) return
    onReorder(arrayMove(ids, oldIndex, newIndex))
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <ul className={listClassName}>
          {items.map((item) => (
            <SortableStackItem
              key={item.id}
              id={item.id}
              label={item.name}
              className={itemClassName}
            >
              {renderBody(item)}
            </SortableStackItem>
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  )
}
