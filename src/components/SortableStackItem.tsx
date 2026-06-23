// src/components/SortableStackItem.tsx — one draggable row of the Stack list's
// Custom sort (backlog #38). Wraps the existing item body in a <li> wired to
// dnd-kit's useSortable: a dedicated drag handle carries the drag listeners so
// the Edit/Archive buttons and text stay tappable. touch-action:none on the
// handle (set in CSS) lets the PointerSensor own the gesture on touch devices.
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { ReactNode } from 'react'

interface SortableStackItemProps {
  id: number
  label: string // the item name, for the handle's accessible label
  children: ReactNode // the item body (info + actions)
}

export default function SortableStackItem({
  id,
  label,
  children,
}: SortableStackItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : undefined,
  }

  return (
    <li
      ref={setNodeRef}
      style={style}
      className="stack-item stack-item-draggable"
    >
      <button
        ref={setActivatorNodeRef}
        type="button"
        className="stack-drag-handle"
        aria-label={`Drag to reorder ${label}`}
        {...attributes}
        {...listeners}
      >
        <span aria-hidden="true">⠿</span>
      </button>
      {children}
    </li>
  )
}
