// src/components/CollapsibleSection.tsx — a Today-screen section whose body
// can be hidden to reduce clutter. Open/closed is remembered per section in
// localStorage so the layout the user prefers sticks across visits. Default
// is open, so first-time and screen-reader users always see the content.
import { useState, type ReactNode } from 'react'

interface CollapsibleSectionProps {
  title: string
  storageKey: string // unique per section, e.g. 'events'
  defaultOpen?: boolean
  className?: string // extra classes appended to today-section
  children: ReactNode
}

function keyFor(storageKey: string): string {
  return `stacktrack:section:${storageKey}`
}

function readOpen(storageKey: string, fallback: boolean): boolean {
  try {
    const stored = localStorage.getItem(keyFor(storageKey))
    if (stored === 'open') return true
    if (stored === 'closed') return false
  } catch {
    // localStorage unavailable (private mode etc.) — fall back to default
  }
  return fallback
}

export default function CollapsibleSection({
  title,
  storageKey,
  defaultOpen = true,
  className,
  children,
}: CollapsibleSectionProps) {
  const [open, setOpen] = useState(() => readOpen(storageKey, defaultOpen))

  function toggle() {
    setOpen((current) => {
      const next = !current
      try {
        localStorage.setItem(keyFor(storageKey), next ? 'open' : 'closed')
      } catch {
        // ignore persistence failures — state still updates for this session
      }
      return next
    })
  }

  return (
    <section
      className={className ? `today-section ${className}` : 'today-section'}
      aria-label={title}
    >
      <h2 className="today-section-title">
        <button
          type="button"
          className="section-toggle"
          aria-expanded={open}
          onClick={toggle}
        >
          <span className="section-caret" aria-hidden="true">
            {open ? '▾' : '▸'}
          </span>
          {title}
        </button>
      </h2>
      {open && children}
    </section>
  )
}
