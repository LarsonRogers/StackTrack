// src/components/GraphMarkerPopup.tsx — the detail card shown when a marker
// (a vertical "divider") on the Graphs chart is tapped. Read-only: it shows
// what a stack change or health event was, not an editor (note editing stays
// in the list below the chart). GraphsScreen owns selection + positioning and
// passes a normalized `data` object plus the handle's pixel x. A fixed,
// transparent backdrop catches taps outside the card to dismiss it; Esc also
// closes. Anchored horizontally to the marker via `x` (clamped by the parent).
import { useEffect, useRef } from 'react'

export interface MarkerPopupData {
  color: string // the marker/type color (the colored dot)
  dateLabel: string // formatted date, e.g. "Jun 11"
  typeLabel: string // small caption, e.g. "Stack change" or "Appointment"
  title: string // the change/event label, e.g. "Started Vitamin D"
  note?: string // the stack-change "why" note, if any (health events have none)
}

interface GraphMarkerPopupProps {
  data: MarkerPopupData
  x: number // handle pixel x within the chart container (already clamped)
  onClose: () => void
}

export default function GraphMarkerPopup({
  data,
  x,
  onClose,
}: GraphMarkerPopupProps) {
  const closeRef = useRef<HTMLButtonElement>(null)

  // Move focus into the popup on open (accessible dismissal target) — mount-only
  // so a background re-render (e.g. a useLiveQuery fire in the parent while the
  // popup is open) can't yank focus back to the close button after the user has
  // tabbed away. On close, focus drops to <body>: restoring it to the exact SVG
  // marker handle isn't reliable (Recharts re-renders it), so it's left as-is.
  useEffect(() => {
    closeRef.current?.focus()
  }, [])

  // Esc closes; keyed on the latest onClose so it always calls the current one.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  return (
    <>
      <div
        className="graph-marker-backdrop"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className="graph-marker-popup"
        role="dialog"
        aria-label={`${data.typeLabel}: ${data.title}`}
        style={{ left: x }}
      >
        <button
          type="button"
          ref={closeRef}
          className="graph-marker-close"
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>
        <div className="graph-marker-caption">
          <span
            className="graph-change-dot"
            style={{ backgroundColor: data.color }}
            aria-hidden="true"
          />
          <span>{data.typeLabel}</span>
          <span className="graph-marker-date">{data.dateLabel}</span>
        </div>
        <p className="graph-marker-title">{data.title}</p>
        {data.note && <p className="graph-marker-note">{data.note}</p>}
      </div>
    </>
  )
}
