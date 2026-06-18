// src/NavContext.ts — lets any screen header drop in the settings cog without
// prop-drilling navigation through every screen. App owns the view state and
// provides this; SettingsMenu consumes it. Bottom-bar navigation (Today,
// Graphs) still flows through NavBar props — this is only for the cog menu.
import { createContext, useContext } from 'react'
import type { View } from './components/NavBar'

export interface NavContextValue {
  active: View
  navigate: (view: View) => void
}

export const NavContext = createContext<NavContextValue>({
  active: 'today',
  navigate: () => {},
})

export function useNav(): NavContextValue {
  return useContext(NavContext)
}
