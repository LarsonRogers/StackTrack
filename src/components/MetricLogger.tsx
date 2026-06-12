// src/components/MetricLogger.tsx — one metric's logging row on the Today
// screen. Rating metrics: tap a 1–10 button (tap the current value again to
// clear). Number metrics: type and save (save empty to clear). Persistence
// goes through metricEntryRepository.
import { useState } from 'react'
import type { Metric, MetricEntry } from '../db/db'
import { clearMetricEntry, setMetricEntry } from '../db/metricEntryRepository'

const RATING_VALUES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

interface MetricLoggerProps {
  metric: Metric
  entry: MetricEntry | undefined // today's value, if logged
  date: string
}

export default function MetricLogger({
  metric,
  entry,
  date,
}: MetricLoggerProps) {
  return (
    <li className="metric-logger">
      <span className="metric-logger-name">
        {metric.name}
        {metric.unit && (
          <span className="stack-item-detail"> ({metric.unit})</span>
        )}
      </span>
      {metric.kind === 'rating' ? (
        <RatingButtons metric={metric} entry={entry} date={date} />
      ) : (
        <NumberInput metric={metric} entry={entry} date={date} />
      )}
    </li>
  )
}

function RatingButtons({ metric, entry, date }: MetricLoggerProps) {
  async function handleTap(value: number) {
    if (entry?.value === value) {
      await clearMetricEntry(metric.id, date) // tap current value = undo
    } else {
      await setMetricEntry(metric.id, date, value)
    }
  }

  return (
    <div
      className="metric-rating"
      role="group"
      aria-label={`${metric.name} rating`}
    >
      {RATING_VALUES.map((value) => (
        <button
          key={value}
          type="button"
          className={
            entry?.value === value
              ? 'metric-rating-button metric-rating-selected'
              : 'metric-rating-button'
          }
          aria-pressed={entry?.value === value}
          onClick={() => handleTap(value)}
        >
          {value}
        </button>
      ))}
    </div>
  )
}

function NumberInput({ metric, entry, date }: MetricLoggerProps) {
  const [draft, setDraft] = useState(entry?.value.toString() ?? '')
  const [error, setError] = useState<string | null>(null)

  async function handleSave() {
    const trimmed = draft.trim()
    if (trimmed === '') {
      await clearMetricEntry(metric.id, date) // save empty = clear
      setError(null)
      return
    }
    const value = Number(trimmed)
    if (!Number.isFinite(value)) {
      setError('Please enter a number.')
      return
    }
    setError(null)
    await setMetricEntry(metric.id, date, value)
  }

  return (
    <div className="metric-number">
      <label className="visually-hidden" htmlFor={`metric-value-${metric.id}`}>
        {metric.name} value
      </label>
      <input
        id={`metric-value-${metric.id}`}
        type="number"
        inputMode="decimal"
        step="any"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
      />
      <button
        type="button"
        className="button-primary button-compact"
        onClick={handleSave}
      >
        Save
      </button>
      {entry && <span className="metric-number-saved">✓ {entry.value}</span>}
      {error && (
        <span className="item-form-error" role="alert">
          {error}
        </span>
      )}
    </div>
  )
}
