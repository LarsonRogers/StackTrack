// src/components/NavBar.tsx — bottom tab bar for switching top-level views.
// Pure presentation: receives the active view and reports taps; App owns
// which view is shown.
export type View = 'today' | 'stack' | 'metrics' | 'graphs' | 'sync'

const TABS: { view: View; label: string }[] = [
  { view: 'today', label: 'Today' },
  { view: 'stack', label: 'Stack' },
  { view: 'metrics', label: 'Tracking' },
  { view: 'graphs', label: 'Graphs' },
  { view: 'sync', label: 'Sync' },
]

interface NavBarProps {
  active: View
  onChange: (view: View) => void
}

export default function NavBar({ active, onChange }: NavBarProps) {
  return (
    <nav className="navbar" aria-label="Main">
      {TABS.map(({ view, label }) => (
        <button
          key={view}
          type="button"
          className={
            view === active ? 'navbar-tab navbar-tab-active' : 'navbar-tab'
          }
          aria-current={view === active ? 'page' : undefined}
          onClick={() => onChange(view)}
        >
          {label}
        </button>
      ))}
    </nav>
  )
}
