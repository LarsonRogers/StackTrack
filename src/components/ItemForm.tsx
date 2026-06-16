// src/components/ItemForm.tsx — add/edit form for one stack item. Owns only
// form state and validation; persistence happens in the onSubmit handler the
// parent passes in (which calls the repository).
import { useState } from 'react'
import type { StackItemInput } from '../db/stackRepository'

const DEFAULT_TIME = '08:00'

const EMPTY_FORM: StackItemInput = {
  name: '',
  kind: 'supplement',
  dose: '',
  times: [DEFAULT_TIME],
  groups: [],
}

interface ItemFormProps {
  initial?: StackItemInput // present = edit mode
  groupSuggestions: string[]
  onSubmit: (input: StackItemInput) => Promise<void>
  onCancel: () => void
}

export default function ItemForm({
  initial,
  groupSuggestions,
  onSubmit,
  onCancel,
}: ItemFormProps) {
  const [form, setForm] = useState<StackItemInput>(initial ?? EMPTY_FORM)
  const [groupDraft, setGroupDraft] = useState('')
  const [error, setError] = useState<string | null>(null)
  const isEdit = initial !== undefined

  function setField<Key extends keyof StackItemInput>(
    key: Key,
    value: StackItemInput[Key],
  ) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  function setTime(index: number, value: string) {
    setField(
      'times',
      form.times.map((time, i) => (i === index ? value : time)),
    )
  }

  // Append a group unless it's blank or already present (case-insensitive).
  // Pure: used both for live state updates and to fold the draft at submit.
  function withGroup(groups: string[], raw: string): string[] {
    const name = raw.trim()
    if (name === '') return groups
    const exists = groups.some((g) => g.toLowerCase() === name.toLowerCase())
    return exists ? groups : [...groups, name]
  }

  // Functional update so rapid successive adds never read stale state.
  function commitGroup(raw: string) {
    setForm((current) => ({
      ...current,
      groups: withGroup(current.groups, raw),
    }))
    setGroupDraft('')
  }

  function removeGroup(name: string) {
    setForm((current) => ({
      ...current,
      groups: current.groups.filter((group) => group !== name),
    }))
  }

  function handleGroupKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault() // Enter would otherwise submit the form
      commitGroup(groupDraft)
    } else if (event.key === 'Backspace' && groupDraft === '') {
      const last = form.groups[form.groups.length - 1]
      if (last) removeGroup(last)
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (form.name.trim() === '') {
      setError('Please enter a name.')
      return
    }
    if (form.times.every((time) => time === '')) {
      setError('Please set at least one time of day.')
      return
    }
    setError(null)
    // Fold any group still typed but not yet committed to a chip.
    await onSubmit({
      ...form,
      groups: withGroup(form.groups, groupDraft),
      times: form.times.filter((time) => time !== ''),
    })
  }

  return (
    <form className="item-form" onSubmit={handleSubmit}>
      <h2>{isEdit ? `Edit ${initial.name}` : 'Add to your stack'}</h2>

      <label htmlFor="item-name">Name</label>
      <input
        id="item-name"
        type="text"
        value={form.name}
        onChange={(e) => setField('name', e.target.value)}
        placeholder="e.g. Zinc"
      />

      <fieldset className="item-form-kind">
        <legend>Type</legend>
        <label>
          <input
            type="radio"
            name="kind"
            checked={form.kind === 'supplement'}
            onChange={() => setField('kind', 'supplement')}
          />
          Supplement
        </label>
        <label>
          <input
            type="radio"
            name="kind"
            checked={form.kind === 'med'}
            onChange={() => setField('kind', 'med')}
          />
          Medication
        </label>
      </fieldset>

      <label htmlFor="item-dose">Dose</label>
      <input
        id="item-dose"
        type="text"
        value={form.dose}
        onChange={(e) => setField('dose', e.target.value)}
        placeholder="e.g. 25 mg"
      />

      <fieldset className="item-form-times">
        <legend>Times of day</legend>
        {form.times.map((time, index) => (
          <div className="item-form-time-row" key={index}>
            <label className="visually-hidden" htmlFor={`item-time-${index}`}>
              Time {index + 1}
            </label>
            <input
              id={`item-time-${index}`}
              type="time"
              value={time}
              onChange={(e) => setTime(index, e.target.value)}
            />
            {form.times.length > 1 && (
              <button
                type="button"
                className="button-subtle"
                aria-label={`Remove time ${index + 1}`}
                onClick={() =>
                  setField(
                    'times',
                    form.times.filter((_, i) => i !== index),
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
          onClick={() => setField('times', [...form.times, DEFAULT_TIME])}
        >
          + Add another time
        </button>
      </fieldset>

      <label htmlFor="item-group">Groups (optional)</label>
      {form.groups.length > 0 && (
        <ul className="group-chips">
          {form.groups.map((group) => (
            <li key={group} className="group-chip">
              {group}
              <button
                type="button"
                className="group-chip-remove"
                aria-label={`Remove group ${group}`}
                onClick={() => removeGroup(group)}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
      <input
        id="item-group"
        type="text"
        list="group-suggestions"
        value={groupDraft}
        onChange={(e) => setGroupDraft(e.target.value)}
        onKeyDown={handleGroupKeyDown}
        placeholder="Type a group, press Enter — e.g. Testosterone Support"
      />
      <datalist id="group-suggestions">
        {groupSuggestions.map((group) => (
          <option key={group} value={group} />
        ))}
      </datalist>

      {error && (
        <p className="item-form-error" role="alert">
          {error}
        </p>
      )}

      <div className="item-form-actions">
        <button type="submit" className="button-primary">
          {isEdit ? 'Save changes' : 'Add to stack'}
        </button>
        <button type="button" className="button-subtle" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  )
}
