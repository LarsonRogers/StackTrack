// src/App.tsx — root component. Owns top-level layout and (eventually) view
// switching between Today / Stack / Metrics / Notes. For the walking skeleton
// there is exactly one view: the empty Today screen. No data or storage yet.
import TodayScreen from './screens/TodayScreen'

export default function App() {
  return <TodayScreen />
}
