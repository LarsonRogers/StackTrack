// src/components/NavBar.tsx — bottom tab bar for the "view" screens. The other
// screens (Stack, Tracking, Sync — and Reminders later) live behind the
// settings cog (SettingsMenu) in each screen header, so the bottom bar stays
// uncluttered. Pure presentation: App owns which view is shown.
export type View =
  | 'today'
  | 'stack'
  | 'metrics'
  | 'graphs'
  | 'adherence'
  | 'sync'
  | 'reminders'

const TABS: { view: View; label: string }[] = [
  { view: 'today', label: 'Today' },
  { view: 'graphs', label: 'Graphs' },
  { view: 'adherence', label: 'Adherence' },
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
