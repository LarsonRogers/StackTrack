// src/App.tsx — root component. Owns which top-level view is shown (no
// routing library — a state switch is enough for a two-tab app). Screens
// own their own content; NavBar reports tab changes.
import { useState } from 'react'
import NavBar, { type View } from './components/NavBar'
import TodayScreen from './screens/TodayScreen'
import StackScreen from './screens/StackScreen'

export default function App() {
  const [view, setView] = useState<View>('today')

  return (
    <>
      <div className="app-content">
        {view === 'today' ? <TodayScreen /> : <StackScreen />}
      </div>
      <NavBar active={view} onChange={setView} />
    </>
  )
}
