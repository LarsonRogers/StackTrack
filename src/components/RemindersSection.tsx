// src/components/RemindersSection.tsx — the Today advisory: reminders that are
// due right now, each actionable with Done (dismiss this occurrence) or Snooze
// (hide for N days). Only rendered when something is due. `date` is today.
import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import { acknowledgeReminder, snoozeReminder } from '../db/reminderRepository'
import { isReminderDue } from '../lib/reminders'

interface RemindersSectionProps {
  date: string // today, 'YYYY-MM-DD'
}

export default function RemindersSection({ date }: RemindersSectionProps) {
  const reminders = useLiveQuery(
    () => db.reminders.where('status').equals('active').toArray(),
    [],
  )
  const items = useLiveQuery(() => db.items.toArray(), [])
  const [snoozing, setSnoozing] = useState<{ id: number; days: string } | null>(
    null,
  )

  if (reminders === undefined || items === undefined) return null

  const due = reminders
    .filter((reminder) => isReminderDue(reminder, date))
    .toSorted((a, b) => (a.time ?? '99:99').localeCompare(b.time ?? '99:99'))
  if (due.length === 0) return null

  const itemNameByUid = new Map(items.map((i) => [i.uid, i.name]))

  async function applySnooze() {
    if (!snoozing) return
    const days = Math.max(1, Math.floor(Number(snoozing.days)) || 1)
    await snoozeReminder(snoozing.id, date, days)
    setSnoozing(null)
  }

  return (
    <section className="today-reminders" aria-label="Reminders due">
      <h2 className="today-section-title">Reminders</h2>
      <ul className="today-list">
        {due.map((reminder) => {
          const itemName = reminder.itemUid
            ? itemNameByUid.get(reminder.itemUid)
            : undefined
          const isSnoozing = snoozing?.id === reminder.id
          return (
            <li key={reminder.id} className="reminder-row">
              <div className="reminder-text">
                {itemName && (
                  <span className="reminder-item">{itemName} — </span>
                )}
                {reminder.text}
                {reminder.time && (
                  <span className="stack-item-detail"> ({reminder.time})</span>
                )}
              </div>
              {isSnoozing ? (
                <div className="reminder-snooze">
                  <label htmlFor={`snooze-${reminder.id}`}>Snooze</label>
                  <input
                    id={`snooze-${reminder.id}`}
                    type="number"
                    min={1}
                    step={1}
                    value={snoozing.days}
                    onChange={(e) =>
                      setSnoozing({ id: reminder.id, days: e.target.value })
                    }
                  />
                  <span>days</span>
                  <button
                    type="button"
                    className="button-primary button-compact"
                    onClick={applySnooze}
                  >
                    Apply
                  </button>
                  <button
                    type="button"
                    className="button-subtle"
                    onClick={() => setSnoozing(null)}
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="reminder-actions">
                  <button
                    type="button"
                    className="button-primary button-compact"
                    onClick={() => acknowledgeReminder(reminder.id, date)}
                  >
                    Done
                  </button>
                  <button
                    type="button"
                    className="button-subtle"
                    onClick={() => setSnoozing({ id: reminder.id, days: '1' })}
                  >
                    Snooze
                  </button>
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
