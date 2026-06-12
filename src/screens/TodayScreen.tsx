// src/screens/TodayScreen.tsx — the "Today" view: the daily check-in screen.
// Walking-skeleton state: renders the app header, today's date, and an empty
// state. The checklist itself (stack items, metrics, notes) arrives with
// backlog items 2–5 — no data model or storage lives here yet.
import { formatTodayHeading } from '../lib/dates'

export default function TodayScreen() {
  const today = new Date()

  return (
    <main className="today">
      <header className="today-header">
        <h1>StackTrack</h1>
        <p className="today-date">{formatTodayHeading(today)}</p>
      </header>

      <section className="today-empty" aria-label="Today's checklist">
        <h2>Today</h2>
        <p>Nothing to take yet — your stack is empty.</p>
        <p className="today-hint">
          Adding medications &amp; supplements is the next build step.
        </p>
      </section>
    </main>
  )
}
