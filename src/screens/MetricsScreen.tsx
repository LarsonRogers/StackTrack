// src/screens/MetricsScreen.tsx — the Metrics view: define what gets tracked
// daily. Definitions only — logging happens on the Today screen, graphs come
// with backlog item 6. Writes go through metricRepository.
import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, type Metric } from '../db/db'
import {
  addMetric,
  archiveMetric,
  MAX_ACTIVE_METRICS,
  unarchiveMetric,
  updateMetric,
  type MetricInput,
} from '../db/metricRepository'
import MetricForm from '../components/MetricForm'

type FormState =
  | { mode: 'closed' }
  | { mode: 'add' }
  | { mode: 'edit'; metric: Metric }

// Plain-language label for a metric's value type.
function kindLabel(metric: Metric): string {
  if (metric.kind === 'rating') return '1–10 rating'
  return metric.unit ? `number (${metric.unit})` : 'number'
}

export default function MetricsScreen() {
  const activeMetrics = useLiveQuery(
    () => db.metrics.where('status').equals('active').toArray(),
    [],
  )
  const archivedMetrics = useLiveQuery(
    () => db.metrics.where('status').equals('archived').toArray(),
    [],
  )
  const [form, setForm] = useState<FormState>({ mode: 'closed' })
  const [showArchived, setShowArchived] = useState(false)
  const [capMessage, setCapMessage] = useState<string | null>(null)

  if (activeMetrics === undefined || archivedMetrics === undefined) return null

  const atCap = activeMetrics.length >= MAX_ACTIVE_METRICS

  async function handleSubmit(input: MetricInput) {
    if (form.mode === 'edit') {
      await updateMetric(form.metric.id, { name: input.name, unit: input.unit })
    } else {
      await addMetric(input)
    }
    setForm({ mode: 'closed' })
  }

  async function handleRestore(metric: Metric) {
    if (atCap) {
      setCapMessage(
        `You're already tracking ${MAX_ACTIVE_METRICS} metrics — archive one to restore "${metric.name}".`,
      )
      return
    }
    setCapMessage(null)
    await unarchiveMetric(metric.id)
  }

  if (form.mode !== 'closed') {
    return (
      <main className="screen">
        <MetricForm
          initial={form.mode === 'edit' ? form.metric : undefined}
          onSubmit={handleSubmit}
          onCancel={() => setForm({ mode: 'closed' })}
        />
      </main>
    )
  }

  return (
    <main className="screen">
      <header className="screen-header">
        <h1>Metrics</h1>
        <p className="screen-subtitle">
          {activeMetrics.length === 0
            ? 'Define what to track each day.'
            : `Tracking ${activeMetrics.length} of ${MAX_ACTIVE_METRICS}`}
        </p>
      </header>

      {atCap ? (
        <p className="screen-note">
          You've reached the {MAX_ACTIVE_METRICS}-metric limit. Archive one to
          add another.
        </p>
      ) : (
        <button
          type="button"
          className="button-primary"
          onClick={() => setForm({ mode: 'add' })}
        >
          + Add metric
        </button>
      )}

      {capMessage && (
        <p className="item-form-error" role="alert">
          {capMessage}
        </p>
      )}

      <ul className="stack-list metric-list">
        {activeMetrics
          .toSorted((a, b) => a.name.localeCompare(b.name))
          .map((metric) => (
            <li key={metric.id} className="stack-item">
              <div className="stack-item-info">
                <span className="stack-item-name">{metric.name}</span>
                <span className="stack-item-detail">{kindLabel(metric)}</span>
              </div>
              <div className="stack-item-actions">
                <button
                  type="button"
                  className="button-subtle"
                  onClick={() => setForm({ mode: 'edit', metric })}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className="button-subtle"
                  onClick={() => archiveMetric(metric.id)}
                >
                  Archive
                </button>
              </div>
            </li>
          ))}
      </ul>

      {archivedMetrics.length > 0 && (
        <section className="stack-archived">
          <button
            type="button"
            className="button-subtle"
            onClick={() => setShowArchived((value) => !value)}
          >
            {showArchived
              ? 'Hide archived'
              : `Show archived (${archivedMetrics.length})`}
          </button>
          {showArchived && (
            <ul className="stack-list">
              {archivedMetrics.map((metric) => (
                <li key={metric.id} className="stack-item stack-item-archived">
                  <div className="stack-item-info">
                    <span className="stack-item-name">{metric.name}</span>
                    <span className="stack-item-detail">
                      {kindLabel(metric)}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="button-subtle"
                    onClick={() => handleRestore(metric)}
                  >
                    Restore
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </main>
  )
}
