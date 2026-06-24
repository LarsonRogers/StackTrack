// src/components/SortableStackItem.tsx — one draggable row of a Custom-sort
// list. Shared by the Stack screen (backlog #38a) and the Today checklist
// (#38b, which passes today-* classes via className). Wraps the row body in a
// <li> wired to dnd-kit's useSortable: a dedicated drag handle carries the drag
// listeners so the row's own buttons/checkbox and text stay tappable.
// touch-action:none on the handle (set in CSS) lets the PointerSensor own the
// gesture on touch devices.
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { ReactNode } from 'react'

interface SortableStackItemProps {
  id: number
  label: string // the item name, for the handle's accessible label
  children: ReactNode // the item body (info + actions)
  className?: string // <li> classes; defaults to the Stack card (#38a)
}

export default function SortableStackItem({
  id,
  label,
  children,
  className = 'stack-item stack-item-draggable',
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
    <li ref={setNodeRef} style={style} className={className}>
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
