// src/components/SettingsMenu.tsx — the top-right settings cog and its menu.
// The bottom nav holds the "view" screens (Today, Graphs); this cog opens the
// "set up" screens (Stack, Tracking, Sync — Reminders joins later). Any screen
// header renders <SettingsMenu/>; navigation flows through NavContext.
import { useEffect, useState } from 'react'
import type { View } from './NavBar'
import { useNav } from '../NavContext'

const SETTINGS_ITEMS: { view: View; label: string }[] = [
  { view: 'stack', label: 'Stack' },
  { view: 'metrics', label: 'Tracking' },
  { view: 'sync', label: 'Sync' },
]

export default function SettingsMenu() {
  const { active, navigate } = useNav()
  const [open, setOpen] = useState(false)

  // Close on Escape for keyboard users.
  useEffect(() => {
    if (!open) return
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  function go(view: View) {
    navigate(view)
    setOpen(false)
  }

  return (
    <div className="settings-menu">
      <button
        type="button"
        className="settings-cog"
        aria-label="Settings"
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <GearIcon />
      </button>
      {open && (
        <>
          <button
            type="button"
            className="settings-backdrop"
            aria-label="Close settings menu"
            onClick={() => setOpen(false)}
          />
          <ul className="settings-dropdown">
            {SETTINGS_ITEMS.map((item) => (
              <li key={item.view}>
                <button
                  type="button"
                  className={
                    item.view === active
                      ? 'settings-item settings-item-active'
                      : 'settings-item'
                  }
                  aria-current={item.view === active ? 'page' : undefined}
                  onClick={() => go(item.view)}
                >
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}

function GearIcon() {
  return (
    <svg
      className="settings-cog-icon"
      viewBox="0 0 24 24"
      width="22"
      height="22"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  )
}
