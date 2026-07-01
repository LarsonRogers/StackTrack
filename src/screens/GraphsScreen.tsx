// src/screens/GraphsScreen.tsx — the Graphs view: one metric over time with
// color-coded vertical markers at stack-change dates (the app's core payoff:
// connect stack changes to metric trends). Read-only over metricEntries and
// stackEvents; all shaping logic lives in lib/graphView.
import { useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  CartesianGrid,
  Legend,
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
  buildCompositeSeries,
  buildEventMarkers,
  buildSeries,
  collapseEvents,
  COMPONENT_COLORS,
  dateToTs,
  RANGE_LABELS,
  rangeStartDate,
  type GraphRange,
} from '../lib/graphView'
import {
  CHANGE_WINDOW_OPTIONS,
  DEFAULT_CHANGE_WINDOW,
  describeChange,
  summarizeChange,
  type ChangeWindow,
} from '../lib/correlation'
import { CATEGORY_LABELS } from '../lib/events'
import { toIsoDate } from '../lib/dates'
import SettingsMenu from '../components/SettingsMenu'
import StackChangeNote from '../components/StackChangeNote'
import GraphMarkerPopup, {
  type MarkerPopupData,
} from '../components/GraphMarkerPopup'
import type { StackEventType } from '../db/db'

const RANGES: GraphRange[] = ['30d', '90d', 'all']

// Small caption shown above a stack-change marker's title in its popup — the
// colored dot already encodes the type, this spells it out.
const STACK_TYPE_CAPTION: Record<StackEventType, string> = {
  added: 'Added to stack',
  changed: 'Stack change',
  removed: 'Removed from stack',
}

// Axis/tooltip date formatting, e.g. "Jun 11".
function formatTs(ts: number): string {
  return new Date(ts).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  })
}

// Recharts passes the reference line's plotting rectangle as `viewBox` to a
// custom label renderer; x is the line's pixel position, y the top of the plot.
interface RefLabelProps {
  viewBox?: { x?: number; y?: number }
}

// A tappable handle drawn at the top of a marker line so the divider can be
// selected to reveal its details. The outer transparent circle is an enlarged
// hit target for touch; `dy` nudges health-event handles below stack ones so
// same-day markers don't stack exactly on top of each other.
function markerHandle(
  props: RefLabelProps,
  opts: {
    color: string
    ariaLabel: string
    dy: number
    onSelect: (x: number) => void
  },
) {
  const x = props.viewBox?.x
  const y = props.viewBox?.y
  if (x === undefined || y === undefined) return <g />
  const cy = y + opts.dy
  return (
    <g
      className="graph-marker-handle"
      role="button"
      tabIndex={0}
      aria-label={opts.ariaLabel}
      onClick={() => opts.onSelect(x)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          opts.onSelect(x)
        }
      }}
    >
      <circle cx={x} cy={cy} r={12} fill="transparent" />
      <circle
        cx={x}
        cy={cy}
        r={5}
        fill={opts.color}
        stroke="#fff"
        strokeWidth={1.5}
      />
    </g>
  )
}

export default function GraphsScreen() {
  const metrics = useLiveQuery(() => db.metrics.toArray(), [])
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [range, setRange] = useState<GraphRange>('30d')
  // Before/after window for the descriptive change summaries (#29) — separate
  // from the chart's time range; same window applies to every change row.
  const [changeWindow, setChangeWindow] = useState<ChangeWindow>(
    DEFAULT_CHANGE_WINDOW,
  )
  // The marker whose details popup is open (tapped on the chart), plus the
  // clamped pixel x to anchor it. Null = nothing selected.
  const chartRef = useRef<HTMLDivElement>(null)
  const [selected, setSelected] = useState<{
    data: MarkerPopupData
    x: number
  } | null>(null)

  // Open a marker's popup, clamping its center so the card stays on-screen.
  function selectMarker(rawX: number, data: MarkerPopupData) {
    const width = chartRef.current?.clientWidth ?? 0
    const half = 96 // half of .graph-marker-popup's 12rem max-width (at 16px root)
    const x =
      width > half * 2 ? Math.max(half, Math.min(rawX, width - half)) : rawX
    setSelected({ data, x })
  }

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
  const healthEvents = useLiveQuery(() => db.healthEvents.toArray(), [])

  if (
    metrics === undefined ||
    entries === undefined ||
    events === undefined ||
    healthEvents === undefined
  )
    return null

  const metric = metrics.find((m) => m.id === metricId)

  if (!metric) {
    return (
      <main className="screen">
        <header className="screen-header">
          <h1>Graphs</h1>
          <p className="screen-subtitle">
            Define a metric on the Tracking tab, log some values, and the graph
            appears here.
          </p>
          <SettingsMenu />
        </header>
      </main>
    )
  }

  const startDate = rangeStartDate(range, new Date())
  const isComposite = metric.kind === 'composite'
  const isBoolean = metric.kind === 'boolean'
  const components = metric.components ?? []
  const series = isComposite ? [] : buildSeries(entries, startDate)
  const compositeSeries = isComposite
    ? buildCompositeSeries(entries, startDate)
    : []
  const chartData = isComposite ? compositeSeries : series
  const hasData = chartData.length > 0
  const markers = collapseEvents(events, startDate)
  const eventMarkers = buildEventMarkers(healthEvents, startDate)

  // Logged points for the selected metric across its whole history (not range-
  // clamped) — the change-summary windows reach outside the visible range.
  // Composite metrics aren't summarized (describeChange returns null), so the
  // values[0]-mirroring `value` is never read for them.
  const metricValues = entries.map((entry) => ({
    date: entry.date,
    value: entry.value,
  }))

  // X domain spans the whole range (or all data + markers for 'all'), so
  // markers render even on dates with no logged value.
  const todayTs = dateToTs(toIsoDate(new Date()))
  const candidateStarts = [
    ...chartData.map((p) => p.ts),
    ...markers.map((m) => m.ts),
    ...eventMarkers.map((m) => m.ts),
  ]
  const domainStart = startDate
    ? dateToTs(startDate)
    : candidateStarts.length > 0
      ? Math.min(...candidateStarts)
      : todayTs
  const yDomain: [number | 'auto', number | 'auto'] =
    metric.kind === 'rating' ? [1, 10] : isBoolean ? [0, 1] : ['auto', 'auto']

  return (
    <main className="screen">
      <header className="screen-header">
        <h1>Graphs</h1>
        <p className="screen-subtitle">
          Track any metric over time, with markers for stack changes and events.
        </p>
        <SettingsMenu />
      </header>

      <div className="graph-controls">
        <label className="visually-hidden" htmlFor="graph-metric">
          Metric
        </label>
        <select
          id="graph-metric"
          value={metric.id}
          onChange={(e) => {
            setSelectedId(Number(e.target.value))
            setSelected(null)
          }}
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
              onClick={() => {
                setRange(r)
                setSelected(null)
              }}
            >
              {RANGE_LABELS[r]}
            </button>
          ))}
        </div>
      </div>

      {!hasData ? (
        <p className="screen-note">
          No values logged for {metric.name} in this range yet — log them on the
          Today screen.
        </p>
      ) : (
        <div className="graph-chart" ref={chartRef}>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart
              data={chartData as object[]}
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
              <YAxis
                domain={yDomain}
                fontSize={12}
                width={48}
                ticks={isBoolean ? [0, 1] : undefined}
                tickFormatter={
                  isBoolean ? (v) => (v === 1 ? 'Yes' : 'No') : undefined
                }
              />
              <Tooltip
                labelFormatter={(ts) => formatTs(Number(ts))}
                formatter={(value, seriesName) =>
                  isComposite
                    ? [value, seriesName]
                    : isBoolean
                      ? [value === 1 ? 'Yes' : 'No', metric.name]
                      : [
                          `${value}${metric.unit ? ` ${metric.unit}` : ''}`,
                          metric.name,
                        ]
                }
              />
              {markers.map((marker) => (
                <ReferenceLine
                  key={`${marker.date}-${marker.label}`}
                  x={marker.ts}
                  stroke={marker.color}
                  strokeWidth={2}
                  strokeDasharray="5 3"
                  label={(props: RefLabelProps) =>
                    markerHandle(props, {
                      color: marker.color,
                      ariaLabel: `Show details: ${marker.label}, ${formatTs(marker.ts)}`,
                      dy: 0,
                      onSelect: (x) =>
                        selectMarker(x, {
                          color: marker.color,
                          dateLabel: formatTs(marker.ts),
                          typeLabel: STACK_TYPE_CAPTION[marker.type],
                          title: marker.label,
                          note: marker.note,
                        }),
                    })
                  }
                />
              ))}
              {eventMarkers.map((marker, index) => (
                <ReferenceLine
                  key={`event-${marker.date}-${index}`}
                  x={marker.ts}
                  stroke={marker.color}
                  strokeWidth={2}
                  strokeDasharray="2 2"
                  label={(props: RefLabelProps) =>
                    markerHandle(props, {
                      color: marker.color,
                      ariaLabel: `Show details: ${CATEGORY_LABELS[marker.category]}, ${marker.label}, ${formatTs(marker.ts)}`,
                      dy: 16,
                      onSelect: (x) =>
                        selectMarker(x, {
                          color: marker.color,
                          dateLabel: formatTs(marker.ts),
                          typeLabel: CATEGORY_LABELS[marker.category],
                          title: marker.label,
                        }),
                    })
                  }
                />
              ))}
              {isComposite ? (
                <>
                  <Legend />
                  {components.map((component, index) => (
                    <Line
                      key={index}
                      type="monotone"
                      dataKey={(point: { values: number[] }) =>
                        point.values[index]
                      }
                      name={
                        component.unit
                          ? `${component.name} (${component.unit})`
                          : component.name
                      }
                      stroke={COMPONENT_COLORS[index % COMPONENT_COLORS.length]}
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      isAnimationActive={false}
                    />
                  ))}
                </>
              ) : (
                <Line
                  type={isBoolean ? 'stepAfter' : 'monotone'}
                  dataKey="value"
                  stroke="#0f766e"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  isAnimationActive={false}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
          {selected && (
            <GraphMarkerPopup
              data={selected.data}
              x={selected.x}
              onClose={() => setSelected(null)}
            />
          )}
        </div>
      )}

      {markers.length > 0 && (
        <section className="graph-changes" aria-label="Stack changes">
          <h2 className="today-section-title">Stack changes in this period</h2>
          <div className="graph-window">
            <label htmlFor="graph-window">Compare {metric.name} averages</label>
            <select
              id="graph-window"
              value={changeWindow}
              onChange={(e) =>
                setChangeWindow(Number(e.target.value) as ChangeWindow)
              }
            >
              {CHANGE_WINDOW_OPTIONS.map((days) => (
                <option key={days} value={days}>
                  {days} days
                </option>
              ))}
            </select>
            <span>before &amp; after each change</span>
          </div>
          <ul className="graph-change-list">
            {markers.map((marker) => {
              const summary = describeChange(
                summarizeChange(metricValues, marker.date, changeWindow),
                { name: metric.name, kind: metric.kind, unit: metric.unit },
              )
              return (
                <li
                  key={`${marker.date}-${marker.label}`}
                  className="graph-change-item"
                >
                  <div className="graph-change">
                    <span
                      className="graph-change-dot"
                      style={{ backgroundColor: marker.color }}
                      aria-hidden="true"
                    />
                    <span className="graph-change-date">
                      {formatTs(marker.ts)}
                    </span>
                    <span>{marker.label}</span>
                  </div>
                  {summary && <p className="graph-change-summary">{summary}</p>}
                  <StackChangeNote
                    eventIds={marker.eventIds}
                    note={marker.note}
                    label={marker.label}
                  />
                </li>
              )
            })}
          </ul>
        </section>
      )}

      {eventMarkers.length > 0 && (
        <section className="graph-changes" aria-label="Health events">
          <h2 className="today-section-title">Health events in this period</h2>
          <ul className="graph-change-list">
            {eventMarkers.map((marker, index) => (
              <li
                key={`event-${marker.date}-${index}`}
                className="graph-change"
              >
                <span
                  className="graph-change-dot"
                  style={{ backgroundColor: marker.color }}
                  aria-hidden="true"
                />
                <span className="graph-change-date">{formatTs(marker.ts)}</span>
                <span>
                  {CATEGORY_LABELS[marker.category]}: {marker.label}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  )
}
