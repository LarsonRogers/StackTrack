// src/App.tsx — root component. Owns which top-level view is shown (no
// routing library — a state switch is enough for a two-tab app). Screens
// own their own content; NavBar reports tab changes.
import { useState } from 'react'
import NavBar, { type View } from './components/NavBar'
import TodayScreen from './screens/TodayScreen'
import StackScreen from './screens/StackScreen'
import MetricsScreen from './screens/MetricsScreen'

const SCREENS: Record<View, React.ComponentType> = {
  today: TodayScreen,
  stack: StackScreen,
  metrics: MetricsScreen,
}

export default function App() {
  const [view, setView] = useState<View>('today')
  const Screen = SCREENS[view]

  return (
    <>
      <div className="app-content">
        <Screen />
      </div>
      <NavBar active={view} onChange={setView} />
    </>
  )
}
