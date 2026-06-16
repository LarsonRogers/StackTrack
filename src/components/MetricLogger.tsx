// src/components/MetricLogger.tsx — one metric's logging row on the Today
// screen. Rating metrics: tap a 1–10 button (tap the current value again to
// clear). Number metrics: type and save (save empty to clear). Persistence
// goes through metricEntryRepository.
import { useState } from 'react'
import type { Metric, MetricEntry } from '../db/db'
import {
  clearMetricEntry,
  setCompositeEntry,
  setMetricEntry,
} from '../db/metricEntryRepository'

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
      ) : metric.kind === 'composite' ? (
        <CompositeInput metric={metric} entry={entry} date={date} />
      ) : metric.kind === 'boolean' ? (
        <BooleanToggle metric={metric} entry={entry} date={date} />
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

// Yes/no tracking (e.g. "Exercised today?"). A checkbox stored as value 1
// when checked; unchecking clears the day's entry (no value logged).
function BooleanToggle({ metric, entry, date }: MetricLoggerProps) {
  const checked = entry?.value === 1

  async function handleToggle() {
    if (checked) {
      await clearMetricEntry(metric.id, date)
    } else {
      await setMetricEntry(metric.id, date, 1)
    }
  }

  return (
    <label className="metric-switch">
      <input
        type="checkbox"
        className="metric-switch-input"
        aria-label={metric.name}
        checked={checked}
        onChange={handleToggle}
      />
      <span className="metric-switch-track" aria-hidden="true">
        <span className="metric-switch-thumb" />
      </span>
      <span className="metric-switch-label">{checked ? 'Yes' : 'No'}</span>
    </label>
  )
}

// One number input per component (e.g. Systolic / Diastolic). Save all at
// once; clearing every field removes the day's entry. Shows "120/80" once saved.
function CompositeInput({ metric, entry, date }: MetricLoggerProps) {
  const components = metric.components ?? []
  const [drafts, setDrafts] = useState<string[]>(() =>
    components.map((_, i) => entry?.values?.[i]?.toString() ?? ''),
  )
  const [error, setError] = useState<string | null>(null)

  function setDraft(index: number, value: string) {
    setDrafts((current) => current.map((d, i) => (i === index ? value : d)))
  }

  async function handleSave() {
    const trimmed = drafts.map((d) => d.trim())
    if (trimmed.every((d) => d === '')) {
      await clearMetricEntry(metric.id, date) // all empty = clear
      setError(null)
      return
    }
    if (trimmed.some((d) => d === '')) {
      setError('Please enter all parts.')
      return
    }
    const values = trimmed.map(Number)
    if (values.some((v) => !Number.isFinite(v))) {
      setError('Please enter numbers only.')
      return
    }
    setError(null)
    await setCompositeEntry(metric.id, date, values)
  }

  return (
    <div className="metric-composite">
      <div className="metric-composite-inputs">
        {components.map((component, index) => (
          <span className="metric-composite-field" key={index}>
            <label htmlFor={`metric-value-${metric.id}-${index}`}>
              {component.name}
              {component.unit && ` (${component.unit})`}
            </label>
            <input
              id={`metric-value-${metric.id}-${index}`}
              type="number"
              inputMode="decimal"
              step="any"
              value={drafts[index] ?? ''}
              onChange={(e) => setDraft(index, e.target.value)}
            />
          </span>
        ))}
      </div>
      <button
        type="button"
        className="button-primary button-compact"
        onClick={handleSave}
      >
        Save
      </button>
      {entry?.values && (
        <span className="metric-number-saved">✓ {entry.values.join('/')}</span>
      )}
      {error && (
        <span className="item-form-error" role="alert">
          {error}
        </span>
      )}
    </div>
  )
}
