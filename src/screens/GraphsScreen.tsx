// src/screens/GraphsScreen.tsx — the Graphs view: one metric over time with
// color-coded vertical markers at stack-change dates (the app's core payoff:
// connect stack changes to metric trends). Read-only over metricEntries and
// stackEvents; all shaping logic lives in lib/graphView.
import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { db } from '../db/db'
import {
  buildSeries,
  collapseEvents,
  dateToTs,
  RANGE_LABELS,
  rangeStartDate,
  type GraphRange,
} from '../lib/graphView'
import { toIsoDate } from '../lib/dates'

const RANGES: GraphRange[] = ['30d', '90d', 'all']

// Axis/tooltip date formatting, e.g. "Jun 11".
function formatTs(ts: number): string {
  return new Date(ts).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  })
}

export default function GraphsScreen() {
  const metrics = useLiveQuery(() => db.metrics.toArray(), [])
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [range, setRange] = useState<GraphRange>('30d')

  const metricId = selectedId ?? metrics?.[0]?.id
  // All entries for one metric via the [metricId+date] compound index:
  // between [id, ''] and [id, '￿'] spans every date for that id.
  const entries = useLiveQuery(
    () =>
      metricId === undefined
        ? []
        : db.metricEntries
            .where('[metricId+date]')
            .between([metricId, ''], [metricId, '￿'])
            .toArray(),
    [metricId],
  )
  const events = useLiveQuery(() => db.stackEvents.toArray(), [])

  if (metrics === undefined || entries === undefined || events === undefined)
    return null

  const metric = metrics.find((m) => m.id === metricId)

  if (!metric) {
    return (
      <main className="screen">
        <header className="screen-header">
          <h1>Graphs</h1>
          <p className="screen-subtitle">
            Define a metric on the Metrics tab, log some values, and the graph
            appears here.
          </p>
        </header>
      </main>
    )
  }

  const startDate = rangeStartDate(range, new Date())
  const series = buildSeries(entries, startDate)
  const markers = collapseEvents(events, startDate)

  // X domain spans the whole range (or all data + markers for 'all'), so
  // markers render even on dates with no logged value.
  const todayTs = dateToTs(toIsoDate(new Date()))
  const candidateStarts = [
    ...series.map((p) => p.ts),
    ...markers.map((m) => m.ts),
  ]
  const domainStart = startDate
    ? dateToTs(startDate)
    : candidateStarts.length > 0
      ? Math.min(...candidateStarts)
      : todayTs
  const yDomain: [number | 'auto', number | 'auto'] =
    metric.kind === 'rating' ? [1, 10] : ['auto', 'auto']

  return (
    <main className="screen">
      <header className="screen-header">
        <h1>Graphs</h1>
      </header>

      <div className="graph-controls">
        <label className="visually-hidden" htmlFor="graph-metric">
          Metric
        </label>
        <select
          id="graph-metric"
          value={metric.id}
          onChange={(e) => setSelectedId(Number(e.target.value))}
        >
          {metrics.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
              {m.status === 'archived' ? ' (archived)' : ''}
            </option>
          ))}
        </select>

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
      </div>

      {series.length === 0 ? (
        <p className="screen-note">
          No values logged for {metric.name} in this range yet — log them on the
          Today screen.
        </p>
      ) : (
        <div className="graph-chart">
          <ResponsiveContainer width="100%" height={280}>
            <LineChart
              data={series}
              margin={{ top: 8, right: 8, bottom: 0, left: -16 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="ts"
                type="number"
                domain={[domainStart, todayTs]}
                tickFormatter={formatTs}
                fontSize={12}
              />
              <YAxis domain={yDomain} fontSize={12} width={48} />
              <Tooltip
                labelFormatter={(ts) => formatTs(Number(ts))}
                formatter={(value) => [
                  `${value}${metric.unit ? ` ${metric.unit}` : ''}`,
                  metric.name,
                ]}
              />
              {markers.map((marker) => (
                <ReferenceLine
                  key={`${marker.date}-${marker.label}`}
                  x={marker.ts}
                  stroke={marker.color}
                  strokeWidth={2}
                  strokeDasharray="5 3"
                />
              ))}
              <Line
                type="monotone"
                dataKey="value"
                stroke="#0f766e"
                strokeWidth={2}
                dot={{ r: 3 }}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {markers.length > 0 && (
        <section className="graph-changes" aria-label="Stack changes">
          <h2 className="today-section-title">Stack changes in this period</h2>
          <ul className="graph-change-list">
            {markers.map((marker) => (
              <li
                key={`${marker.date}-${marker.label}`}
                className="graph-change"
              >
                <span
                  className="graph-change-dot"
                  style={{ backgroundColor: marker.color }}
                  aria-hidden="true"
                />
                <span className="graph-change-date">{formatTs(marker.ts)}</span>
                <span>{marker.label}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  )
}
