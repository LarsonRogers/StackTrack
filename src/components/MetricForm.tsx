// src/components/MetricForm.tsx — add/edit form for one metric definition.
// Kind is choosable only when creating: changing it later would corrupt the
// meaning of already-logged values, so in edit mode the radios are disabled.
import { useState } from 'react'
import type { Metric, MetricKind } from '../db/db'
import type { MetricInput } from '../db/metricRepository'

interface MetricFormProps {
  initial?: Metric // present = edit mode
  onSubmit: (input: MetricInput) => Promise<void>
  onCancel: () => void
}

export default function MetricForm({
  initial,
  onSubmit,
  onCancel,
}: MetricFormProps) {
  const [name, setName] = useState(initial?.name ?? '')
  const [kind, setKind] = useState<MetricKind>(initial?.kind ?? 'rating')
  const [unit, setUnit] = useState(initial?.unit ?? '')
  const [error, setError] = useState<string | null>(null)
  const isEdit = initial !== undefined

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (name.trim() === '') {
      setError('Please enter a name.')
      return
    }
    setError(null)
    await onSubmit({
      name,
      kind,
      unit: kind === 'number' ? unit : undefined,
    })
  }

  return (
    <form className="item-form" onSubmit={handleSubmit}>
      <h2>{isEdit ? `Edit ${initial.name}` : 'Add a metric'}</h2>

      <label htmlFor="metric-name">Name</label>
      <input
        id="metric-name"
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="e.g. Energy"
      />

      <fieldset className="item-form-kind">
        <legend>Type{isEdit && ' (fixed after creation)'}</legend>
        <label>
          <input
            type="radio"
            name="metric-kind"
            checked={kind === 'rating'}
            disabled={isEdit}
            onChange={() => setKind('rating')}
          />
          1–10 rating
        </label>
        <label>
          <input
            type="radio"
            name="metric-kind"
            checked={kind === 'number'}
            disabled={isEdit}
            onChange={() => setKind('number')}
          />
          Number
        </label>
      </fieldset>

      {kind === 'number' && (
        <>
          <label htmlFor="metric-unit">Unit (optional)</label>
          <input
            id="metric-unit"
            type="text"
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            placeholder="e.g. kg, hours"
          />
        </>
      )}

      {error && (
        <p className="item-form-error" role="alert">
          {error}
        </p>
      )}

      <div className="item-form-actions">
        <button type="submit" className="button-primary">
          {isEdit ? 'Save changes' : 'Add metric'}
        </button>
        <button type="button" className="button-subtle" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  )
}
