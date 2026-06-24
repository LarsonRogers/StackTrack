// src/screens/AdherenceScreen.tsx — the Adherence view (backlog #28): how
// consistently the stack was actually taken, over a selectable range. Read-only
// over items + intake records; all math lives in lib/adherence. STRICTLY
// DESCRIPTIVE — it reports measured facts (% taken, streaks, missed-by-weekday)
// and never advises (the permanent no-advice invariant).
//
// Layout: the header, range buttons, and overall summary live in a sticky
// .adherence-head so they stay put while the per-item list scrolls beneath.
import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import { buildAdherenceReport } from '../lib/adherence'
import { RANGE_LABELS, rangeStartDate, type GraphRange } from '../lib/graphView'
import { parseIsoDate, toIsoDate } from '../lib/dates'
import SettingsMenu from '../components/SettingsMenu'

const RANGES: GraphRange[] = ['30d', '90d', 'all']

// Show at most this many missed days before truncating with "…".
const MAX_MISSED_SHOWN = 3

// Short calendar-day label, e.g. 'Jun 24'.
function formatDay(iso: string): string {
  return parseIsoDate(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  })
}

// Full weekday + date, e.g. 'Saturday, Jun 20'.
function formatMissedDay(iso: string): string {
  return parseIsoDate(iso).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  })
}

export default function AdherenceScreen() {
  const items = useLiveQuery(() => db.items.toArray(), [])
  const intakes = useLiveQuery(() => db.intakes.toArray(), [])
  const [range, setRange] = useState<GraphRange>('30d')

  if (items === undefined || intakes === undefined) return null

  const activeItems = items.filter((item) => item.status === 'active')
  const today = toIsoDate(new Date())
  const report = buildAdherenceReport(
    activeItems,
    intakes,
    rangeStartDate(range, new Date()),
    today,
  )
  const hasData = activeItems.length > 0 && report.pct !== null
  const topMissed = report.missedDays.slice(0, MAX_MISSED_SHOWN)
  const missedLabel =
    report.missedDays.length === 0
      ? 'No missed doses in this range.'
      : `Missed most on: ${topMissed.map((m) => formatMissedDay(m.date)).join('; ')}${
          report.missedDays.length > topMissed.length ? '; …' : ''
        }`
  const covered =
    report.from === report.to
      ? formatDay(report.to)
      : `${formatDay(report.from)} – ${formatDay(report.to)}`

  return (
    <main className="screen adherence-screen">
      <div className="adherence-head">
        <header className="screen-header">
          <h1>Adherence</h1>
          <p className="screen-subtitle">
            How consistently you&apos;ve taken your stack — counted from what
            you&apos;ve logged.
          </p>
          <SettingsMenu />
        </header>

        <div className="graph-ranges" role="group" aria-label="Time range">
          {RANGES.map((r) => (
            <button
              key={r}
              type="button"
              className={
                r === range
                  ? 'graph-range-button graph-range-selected'
                  : 'graph-range-button'
              }
              aria-pressed={r === range}
              onClick={() => setRange(r)}
            >
              {RANGE_LABELS[r]}
            </button>
          ))}
        </div>

        {hasData && (
          <section className="adherence-overall" aria-label="Overall adherence">
            <span className="adherence-overall-pct">{report.pct}%</span>
            <span className="adherence-overall-detail">
              {report.taken} of {report.due} doses taken
            </span>
            <span className="adherence-range-caption">{covered}</span>
            <p className="adherence-missed" role="status">
              {missedLabel}
            </p>
          </section>
        )}
      </div>

      {activeItems.length === 0 ? (
        <p className="screen-note">
          Add medications &amp; supplements to your stack to see adherence.
        </p>
      ) : report.pct === null ? (
        <p className="screen-note">
          No doses were due in this range yet — nothing to summarize.
        </p>
      ) : (
        <>
          <h2 className="adherence-subhead">By item</h2>
          <ul className="adherence-list">
            {report.items.map((row) => (
              <li key={row.item.id} className="adherence-item">
                <div className="adherence-item-head">
                  <span className="adherence-item-name">{row.item.name}</span>
                  <span className="adherence-item-pct">{row.pct}%</span>
                </div>
                <div
                  className="adherence-bar"
                  role="img"
                  aria-label={`${row.taken} of ${row.due} doses taken`}
                >
                  <div
                    className="adherence-bar-fill"
                    style={{ width: `${row.pct}%` }}
                  />
                </div>
                <div className="adherence-item-meta">
                  <span>
                    {row.taken} / {row.due} doses
                  </span>
                  {row.streak > 0 && (
                    <span className="adherence-streak">
                      {row.streak}-day streak
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>

          <p className="adherence-footnote">
            Counts active items only, using each item&apos;s current schedule
            from the day it was added. Descriptive of your logged data — not
            medical advice.
          </p>
        </>
      )}
    </main>
  )
}
