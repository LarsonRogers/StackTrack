// src/components/ReminderForm.tsx — add/edit form for one reminder. Owns form
// state and validation; persistence happens in the onSubmit handler the parent
// passes in (which calls reminderRepository).
import { useState } from 'react'
import type { Reminder, ReminderRecurrence } from '../db/db'
import type { ReminderInput } from '../db/reminderRepository'
import { toIsoDate } from '../lib/dates'

// The linked-item options shown in the dropdown (active stack items).
export interface ReminderItemOption {
  uid: string
  name: string
}

interface ReminderFormProps {
  initial?: Reminder // present = edit mode
  items: ReminderItemOption[]
  onSubmit: (input: ReminderInput) => Promise<void>
  onCancel: () => void
}

type Kind = ReminderRecurrence['kind']

export default function ReminderForm({
  initial,
  items,
  onSubmit,
  onCancel,
}: ReminderFormProps) {
  const today = toIsoDate(new Date())
  const rec = initial?.recurrence
  const isEdit = initial !== undefined

  const [text, setText] = useState(initial?.text ?? '')
  const [kind, setKind] = useState<Kind>(rec?.kind ?? 'once')
  const [onceDate, setOnceDate] = useState(
    rec?.kind === 'once' ? rec.date : today,
  )
  const [everyN, setEveryN] = useState(rec?.kind === 'everyNDays' ? rec.n : 7)
  const [onWeeks, setOnWeeks] = useState(
    rec?.kind === 'cycle' ? rec.onWeeks : 3,
  )
  const [offWeeks, setOffWeeks] = useState(
    rec?.kind === 'cycle' ? rec.offWeeks : 1,
  )
  const [startDate, setStartDate] = useState(
    rec?.kind === 'everyNDays' || rec?.kind === 'cycle' ? rec.startDate : today,
  )
  const [time, setTime] = useState(initial?.time ?? '')
  const [itemUid, setItemUid] = useState(initial?.itemUid ?? '')
  const [error, setError] = useState<string | null>(null)

  function buildRecurrence(): ReminderRecurrence {
    if (kind === 'everyNDays')
      return { kind: 'everyNDays', n: everyN, startDate }
    if (kind === 'cycle') return { kind: 'cycle', onWeeks, offWeeks, startDate }
    return { kind: 'once', date: onceDate }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (text.trim() === '') {
      setError('Please enter a reminder message.')
      return
    }
    if (kind === 'everyNDays' && (!Number.isInteger(everyN) || everyN < 1)) {
      setError('"Every N days" needs a whole number of 1 or more.')
      return
    }
    if (kind === 'cycle' && (onWeeks < 1 || offWeeks < 1)) {
      setError('A cycle needs at least 1 week on and 1 week off.')
      return
    }
    setError(null)
    await onSubmit({
      text,
      itemUid: itemUid || undefined,
      recurrence: buildRecurrence(),
      time: time || undefined,
    })
  }

  return (
    <form className="item-form" onSubmit={handleSubmit}>
      <h2>{isEdit ? 'Edit reminder' : 'Add a reminder'}</h2>

      <label htmlFor="reminder-text">Reminder</label>
      <input
        id="reminder-text"
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="e.g. Cycle off KSM-66 this week"
      />

      <fieldset className="item-form-frequency">
        <legend>When</legend>
        <label>
          <input
            type="radio"
            name="reminder-kind"
            checked={kind === 'once'}
            onChange={() => setKind('once')}
          />
          Once, on a date
        </label>
        <label>
          <input
            type="radio"
            name="reminder-kind"
            checked={kind === 'everyNDays'}
            onChange={() => setKind('everyNDays')}
          />
          Every N days
        </label>
        <label>
          <input
            type="radio"
            name="reminder-kind"
            checked={kind === 'cycle'}
            onChange={() => setKind('cycle')}
          />
          Cycle (remind at each off-week)
        </label>

        {kind === 'once' && (
          <div className="item-form-freq-detail">
            <label htmlFor="reminder-date">Date</label>
            <input
              id="reminder-date"
              type="date"
              value={onceDate}
              onChange={(e) => setOnceDate(e.target.value)}
            />
          </div>
        )}

        {kind === 'everyNDays' && (
          <div className="item-form-freq-detail">
            <label htmlFor="reminder-n">Every</label>
            <input
              id="reminder-n"
              type="number"
              min={1}
              step={1}
              value={everyN}
              onChange={(e) => setEveryN(Math.floor(Number(e.target.value)))}
            />
            <span>days</span>
          </div>
        )}

        {kind === 'cycle' && (
          <div className="item-form-freq-detail">
            <label htmlFor="reminder-on">Weeks on</label>
            <input
              id="reminder-on"
              type="number"
              min={1}
              step={1}
              value={onWeeks}
              onChange={(e) => setOnWeeks(Math.floor(Number(e.target.value)))}
            />
            <label htmlFor="reminder-off">off</label>
            <input
              id="reminder-off"
              type="number"
              min={1}
              step={1}
              value={offWeeks}
              onChange={(e) => setOffWeeks(Math.floor(Number(e.target.value)))}
            />
          </div>
        )}

        {(kind === 'everyNDays' || kind === 'cycle') && (
          <div className="item-form-freq-detail">
            <label htmlFor="reminder-start">Starting</label>
            <input
              id="reminder-start"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
        )}
      </fieldset>

      <label htmlFor="reminder-time">Time of day (optional)</label>
      <input
        id="reminder-time"
        type="time"
        value={time}
        onChange={(e) => setTime(e.target.value)}
      />

      <label htmlFor="reminder-item">Linked item (optional)</label>
      <select
        id="reminder-item"
        value={itemUid}
        onChange={(e) => setItemUid(e.target.value)}
      >
        <option value="">None</option>
        {items.map((item) => (
          <option key={item.uid} value={item.uid}>
            {item.name}
          </option>
        ))}
      </select>

      {error && (
        <p className="item-form-error" role="alert">
          {error}
        </p>
      )}

      <div className="item-form-actions">
        <button type="submit" className="button-primary">
          {isEdit ? 'Save changes' : 'Add reminder'}
        </button>
        <button type="button" className="button-subtle" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  )
}
