// src/components/ItemForm.tsx — add/edit form for one stack item. Owns only
// form state and validation; persistence happens in the onSubmit handler the
// parent passes in (which calls the repository).
import { useState } from 'react'
import type { Schedule } from '../db/db'
import type { StackItemInput } from '../db/stackRepository'
import { toIsoDate } from '../lib/dates'

const DEFAULT_TIME = '08:00'

// Frequency UI options. 'daily' maps to no schedule (the every-day default).
type FreqKind = 'daily' | Schedule['kind']

const WEEKDAYS = [
  { value: 0, label: 'Sun' },
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' },
]

// Common dose units offered as suggestions (free text — the user may type any).
const UNIT_SUGGESTIONS = [
  'mg',
  'mcg',
  'g',
  'IU',
  'mL',
  'capsule',
  'capsules',
  'tablet',
  'tablets',
  'drop',
  'drops',
  'spray',
  'sprays',
  'scoop',
  'puff',
]

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

  // Frequency controls, seeded from the item's existing schedule (absent =
  // every day). A start date defaults to today for cadences that need an anchor.
  const sched = initial?.schedule
  const today = toIsoDate(new Date())
  const [freqKind, setFreqKind] = useState<FreqKind>(sched?.kind ?? 'daily')
  const [everyN, setEveryN] = useState(
    sched?.kind === 'everyNDays' ? sched.n : 2,
  )
  const [weekdays, setWeekdays] = useState<number[]>(
    sched?.kind === 'daysOfWeek' ? sched.days : [],
  )
  const [onWeeks, setOnWeeks] = useState(
    sched?.kind === 'cycle' ? sched.onWeeks : 3,
  )
  const [offWeeks, setOffWeeks] = useState(
    sched?.kind === 'cycle' ? sched.offWeeks : 1,
  )
  const [startDate, setStartDate] = useState(
    sched?.kind === 'everyNDays' || sched?.kind === 'cycle'
      ? sched.startDate
      : today,
  )

  // Assembles the Schedule object from the frequency controls (undefined =
  // every day). Validation lives in handleSubmit; the repository re-normalizes.
  function buildSchedule(): Schedule | undefined {
    if (freqKind === 'everyNDays')
      return { kind: 'everyNDays', n: everyN, startDate }
    if (freqKind === 'daysOfWeek') return { kind: 'daysOfWeek', days: weekdays }
    if (freqKind === 'cycle')
      return { kind: 'cycle', onWeeks, offWeeks, startDate }
    return undefined
  }

  function toggleWeekday(value: number) {
    setWeekdays((current) =>
      current.includes(value)
        ? current.filter((d) => d !== value)
        : [...current, value],
    )
  }

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
    if (
      freqKind === 'everyNDays' &&
      (!Number.isInteger(everyN) || everyN < 2)
    ) {
      setError('"Every N days" needs a whole number of 2 or more.')
      return
    }
    if (freqKind === 'daysOfWeek' && weekdays.length === 0) {
      setError('Pick at least one day of the week.')
      return
    }
    if (freqKind === 'cycle' && (onWeeks < 1 || offWeeks < 1)) {
      setError('A cycle needs at least 1 week on and 1 week off.')
      return
    }
    setError(null)
    // Fold any group still typed but not yet committed to a chip.
    await onSubmit({
      ...form,
      groups: withGroup(form.groups, groupDraft),
      times: form.times.filter((time) => time !== ''),
      schedule: buildSchedule(),
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
      <div className="item-form-dose-row">
        <input
          id="item-dose"
          type="text"
          value={form.dose}
          onChange={(e) => setField('dose', e.target.value)}
          placeholder="e.g. 500"
        />
        <input
          id="item-unit"
          type="text"
          list="unit-suggestions"
          aria-label="Unit (optional)"
          value={form.unit ?? ''}
          onChange={(e) => setField('unit', e.target.value || undefined)}
          placeholder="unit (e.g. mg)"
        />
      </div>
      <datalist id="unit-suggestions">
        {UNIT_SUGGESTIONS.map((unit) => (
          <option key={unit} value={unit} />
        ))}
      </datalist>

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

      <fieldset className="item-form-frequency">
        <legend>Frequency</legend>
        <label>
          <input
            type="radio"
            name="frequency"
            checked={freqKind === 'daily'}
            onChange={() => setFreqKind('daily')}
          />
          Every day
        </label>
        <label>
          <input
            type="radio"
            name="frequency"
            checked={freqKind === 'everyNDays'}
            onChange={() => setFreqKind('everyNDays')}
          />
          Every N days
        </label>
        <label>
          <input
            type="radio"
            name="frequency"
            checked={freqKind === 'daysOfWeek'}
            onChange={() => setFreqKind('daysOfWeek')}
          />
          Specific days of the week
        </label>
        <label>
          <input
            type="radio"
            name="frequency"
            checked={freqKind === 'cycle'}
            onChange={() => setFreqKind('cycle')}
          />
          Cycle (weeks on / off)
        </label>

        {freqKind === 'everyNDays' && (
          <div className="item-form-freq-detail">
            <label htmlFor="freq-n">Every</label>
            <input
              id="freq-n"
              type="number"
              min={2}
              step={1}
              value={everyN}
              onChange={(e) => setEveryN(Math.floor(Number(e.target.value)))}
            />
            <span>days{everyN === 2 ? ' (every other day)' : ''}</span>
          </div>
        )}

        {freqKind === 'daysOfWeek' && (
          <div className="item-form-weekdays">
            {WEEKDAYS.map((day) => (
              <label key={day.value} className="item-form-weekday">
                <input
                  type="checkbox"
                  checked={weekdays.includes(day.value)}
                  onChange={() => toggleWeekday(day.value)}
                />
                {day.label}
              </label>
            ))}
          </div>
        )}

        {freqKind === 'cycle' && (
          <div className="item-form-freq-detail">
            <label htmlFor="freq-on">Weeks on</label>
            <input
              id="freq-on"
              type="number"
              min={1}
              step={1}
              value={onWeeks}
              onChange={(e) => setOnWeeks(Math.floor(Number(e.target.value)))}
            />
            <label htmlFor="freq-off">off</label>
            <input
              id="freq-off"
              type="number"
              min={1}
              step={1}
              value={offWeeks}
              onChange={(e) => setOffWeeks(Math.floor(Number(e.target.value)))}
            />
          </div>
        )}

        {(freqKind === 'everyNDays' || freqKind === 'cycle') && (
          <div className="item-form-freq-detail">
            <label htmlFor="freq-start">Starting</label>
            <input
              id="freq-start"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
        )}
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

      <label htmlFor="item-note">Note (optional)</label>
      <p className="item-form-hint">
        Shown on the Today screen under the name.
      </p>
      <textarea
        id="item-note"
        rows={2}
        value={form.note ?? ''}
        onChange={(e) => setField('note', e.target.value || undefined)}
        placeholder="e.g. take with food"
      />

      <fieldset className="item-form-refill">
        <legend>Refill tracking (optional)</legend>
        <p className="item-form-hint">
          Enter how many you have and the days left show on Today and Stack,
          estimated from your schedule. Set "as of" to an earlier date to record
          a past refill.
        </p>
        <div className="item-form-refill-row">
          <div className="item-form-refill-field">
            <label htmlFor="item-qty">Quantity on hand</label>
            <input
              id="item-qty"
              type="number"
              min={0}
              step="any"
              value={form.quantityOnHand ?? ''}
              onChange={(e) =>
                setField(
                  'quantityOnHand',
                  e.target.value === '' ? undefined : Number(e.target.value),
                )
              }
              placeholder="e.g. 60"
            />
          </div>
          <div className="item-form-refill-field">
            <label htmlFor="item-qty-asof">As of</label>
            <input
              id="item-qty-asof"
              type="date"
              max={today}
              value={form.quantityAsOf ?? today}
              onChange={(e) =>
                setField('quantityAsOf', e.target.value || undefined)
              }
            />
          </div>
          <div className="item-form-refill-field">
            <label htmlFor="item-units">Units per dose</label>
            <input
              id="item-units"
              type="number"
              min={1}
              step={1}
              value={form.unitsPerDose ?? ''}
              onChange={(e) =>
                setField(
                  'unitsPerDose',
                  e.target.value === ''
                    ? undefined
                    : Math.floor(Number(e.target.value)),
                )
              }
              placeholder="1"
            />
          </div>
        </div>
      </fieldset>

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
