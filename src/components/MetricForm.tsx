// src/components/MetricForm.tsx — add/edit form for one metric definition.
// Kind is choosable only when creating: changing it later would corrupt the
// meaning of already-logged values, so in edit mode the radios are disabled.
import { useState } from 'react'
import type { Metric, MetricComponent, MetricKind } from '../db/db'
import type { MetricInput } from '../db/metricRepository'

interface MetricFormProps {
  initial?: Metric // present = edit mode
  onSubmit: (input: MetricInput) => Promise<void>
  onCancel: () => void
}

// Composite metrics start with two empty parts (e.g. Systolic / Diastolic).
const EMPTY_COMPONENT: MetricComponent = { name: '', unit: '' }

export default function MetricForm({
  initial,
  onSubmit,
  onCancel,
}: MetricFormProps) {
  const [name, setName] = useState(initial?.name ?? '')
  const [kind, setKind] = useState<MetricKind>(initial?.kind ?? 'rating')
  const [unit, setUnit] = useState(initial?.unit ?? '')
  const [components, setComponents] = useState<MetricComponent[]>(
    initial?.components ?? [{ ...EMPTY_COMPONENT }, { ...EMPTY_COMPONENT }],
  )
  const [error, setError] = useState<string | null>(null)
  const isEdit = initial !== undefined

  function setComponentField(
    index: number,
    field: keyof MetricComponent,
    value: string,
  ) {
    setComponents((current) =>
      current.map((c, i) => (i === index ? { ...c, [field]: value } : c)),
    )
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (name.trim() === '') {
      setError('Please enter a name.')
      return
    }
    if (kind === 'composite' && !isEdit) {
      const named = components.filter((c) => c.name.trim() !== '')
      if (named.length < 2) {
        setError('Add at least two named parts (e.g. Systolic, Diastolic).')
        return
      }
    }
    setError(null)
    await onSubmit({
      name,
      kind,
      unit: kind === 'number' ? unit : undefined,
      components:
        kind === 'composite' && !isEdit
          ? components.filter((c) => c.name.trim() !== '')
          : undefined,
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
        <label>
          <input
            type="radio"
            name="metric-kind"
            checked={kind === 'composite'}
            disabled={isEdit}
            onChange={() => setKind('composite')}
          />
          Multiple numbers
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

      {kind === 'composite' && !isEdit && (
        <fieldset className="item-form-times">
          <legend>Parts</legend>
          <p className="item-form-hint">
            Each part is a number logged together, e.g. Blood Pressure =
            Systolic + Diastolic.
          </p>
          {components.map((component, index) => (
            <div className="metric-component-row" key={index}>
              <label
                className="visually-hidden"
                htmlFor={`metric-component-name-${index}`}
              >
                Part {index + 1} name
              </label>
              <input
                id={`metric-component-name-${index}`}
                type="text"
                value={component.name}
                onChange={(e) =>
                  setComponentField(index, 'name', e.target.value)
                }
                placeholder="e.g. Systolic"
              />
              <label
                className="visually-hidden"
                htmlFor={`metric-component-unit-${index}`}
              >
                Part {index + 1} unit (optional)
              </label>
              <input
                id={`metric-component-unit-${index}`}
                type="text"
                value={component.unit ?? ''}
                onChange={(e) =>
                  setComponentField(index, 'unit', e.target.value)
                }
                placeholder="unit (e.g. mmHg)"
              />
              {components.length > 2 && (
                <button
                  type="button"
                  className="button-subtle"
                  aria-label={`Remove part ${index + 1}`}
                  onClick={() =>
                    setComponents((current) =>
                      current.filter((_, i) => i !== index),
                    )
                  }
                >
                  Remove
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            className="button-subtle"
            onClick={() =>
              setComponents((current) => [...current, { ...EMPTY_COMPONENT }])
            }
          >
            + Add another part
          </button>
        </fieldset>
      )}

      {kind === 'composite' && isEdit && initial.components && (
        <p className="item-form-hint">
          Parts ({initial.components.map((c) => c.name).join(', ')}) are fixed
          after creation.
        </p>
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
