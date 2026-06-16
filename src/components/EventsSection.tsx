// src/components/EventsSection.tsx — per-day health events on the Today
// screen: log discrete events (e.g. "Fever", "GI Doc Appointment") for the
// selected date. Many per day; each removable. Reads live; writes through
// healthEventRepository. Distinct from the one-per-day Journal note.
import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, type EventCategory } from '../db/db'
import { addHealthEvent, deleteHealthEvent } from '../db/healthEventRepository'
import { CATEGORY_LABELS, CATEGORY_ORDER } from '../lib/events'

interface EventsSectionProps {
  date: string // local 'YYYY-MM-DD'
}

export default function EventsSection({ date }: EventsSectionProps) {
  const events = useLiveQuery(
    () => db.healthEvents.where('date').equals(date).toArray(),
    [date],
  )
  const [label, setLabel] = useState('')
  const [category, setCategory] = useState<EventCategory>('symptom')

  if (events === undefined) return null

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (label.trim() === '') return
    await addHealthEvent(date, label, category)
    setLabel('')
    setCategory('symptom')
  }

  return (
    <section className="today-section" aria-label="Events">
      <h2 className="today-section-title">Events</h2>
      <form className="event-add-row" onSubmit={handleAdd}>
        <label className="visually-hidden" htmlFor="event-label">
          Event
        </label>
        <input
          id="event-label"
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="e.g. Fever, GI Doc Appointment"
        />
        <label className="visually-hidden" htmlFor="event-category">
          Category
        </label>
        <select
          id="event-category"
          value={category}
          onChange={(e) => setCategory(e.target.value as EventCategory)}
        >
          {CATEGORY_ORDER.map((key) => (
            <option key={key} value={key}>
              {CATEGORY_LABELS[key]}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="button-primary button-compact"
          disabled={label.trim() === ''}
        >
          Add
        </button>
      </form>

      {events.length > 0 && (
        <ul className="event-list">
          {events.map((event) => (
            <li key={event.id} className="event-item">
              <span className={`event-badge event-badge-${event.category}`}>
                {CATEGORY_LABELS[event.category]}
              </span>
              <span className="event-label">{event.label}</span>
              <button
                type="button"
                className="event-remove"
                aria-label={`Remove ${event.label}`}
                onClick={() => deleteHealthEvent(event.id)}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
