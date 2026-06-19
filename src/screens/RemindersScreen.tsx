// src/screens/RemindersScreen.tsx — manage reminders (the cog-menu screen):
// define what gets surfaced on Today and when. Acting on due reminders (Done /
// Snooze) happens on the Today screen. Writes go through reminderRepository.
import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, type Reminder } from '../db/db'
import {
  addReminder,
  archiveReminder,
  unarchiveReminder,
  updateReminder,
  type ReminderInput,
} from '../db/reminderRepository'
import { describeRecurrence } from '../lib/reminders'
import ReminderForm from '../components/ReminderForm'
import SettingsMenu from '../components/SettingsMenu'

type FormState =
  | { mode: 'closed' }
  | { mode: 'add' }
  | { mode: 'edit'; reminder: Reminder }

export default function RemindersScreen() {
  const activeReminders = useLiveQuery(
    () => db.reminders.where('status').equals('active').toArray(),
    [],
  )
  const archivedReminders = useLiveQuery(
    () => db.reminders.where('status').equals('archived').toArray(),
    [],
  )
  const activeItems = useLiveQuery(
    () => db.items.where('status').equals('active').toArray(),
    [],
  )
  const [form, setForm] = useState<FormState>({ mode: 'closed' })
  const [showArchived, setShowArchived] = useState(false)

  if (
    activeReminders === undefined ||
    archivedReminders === undefined ||
    activeItems === undefined
  )
    return null

  const itemOptions = activeItems
    .map((item) => ({ uid: item.uid, name: item.name }))
    .sort((a, b) => a.name.localeCompare(b.name))
  const itemNameByUid = new Map(activeItems.map((i) => [i.uid, i.name]))

  async function handleSubmit(input: ReminderInput) {
    if (form.mode === 'edit') {
      await updateReminder(form.reminder.id, input)
    } else {
      await addReminder(input)
    }
    setForm({ mode: 'closed' })
  }

  if (form.mode !== 'closed') {
    return (
      <main className="screen">
        <ReminderForm
          initial={form.mode === 'edit' ? form.reminder : undefined}
          items={itemOptions}
          onSubmit={handleSubmit}
          onCancel={() => setForm({ mode: 'closed' })}
        />
      </main>
    )
  }

  function detail(reminder: Reminder): string {
    const parts = [describeRecurrence(reminder.recurrence)]
    if (reminder.time) parts.push(`at ${reminder.time}`)
    if (reminder.itemUid && itemNameByUid.has(reminder.itemUid))
      parts.push(itemNameByUid.get(reminder.itemUid)!)
    return parts.join(' · ')
  }

  return (
    <main className="screen">
      <header className="screen-header">
        <h1>Reminders</h1>
        <p className="screen-subtitle">
          {activeReminders.length === 0
            ? 'Queue advisories that show on Today when due.'
            : `${activeReminders.length} reminder${activeReminders.length === 1 ? '' : 's'}`}
        </p>
        <SettingsMenu />
      </header>

      <button
        type="button"
        className="button-primary"
        onClick={() => setForm({ mode: 'add' })}
      >
        + Add reminder
      </button>

      <ul className="stack-list metric-list">
        {activeReminders
          .toSorted((a, b) => a.text.localeCompare(b.text))
          .map((reminder) => (
            <li key={reminder.id} className="stack-item">
              <div className="stack-item-info">
                <span className="stack-item-name">{reminder.text}</span>
                <span className="stack-item-detail">{detail(reminder)}</span>
              </div>
              <div className="stack-item-actions">
                <button
                  type="button"
                  className="button-subtle"
                  onClick={() => setForm({ mode: 'edit', reminder })}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className="button-subtle"
                  onClick={() => archiveReminder(reminder.id)}
                >
                  Archive
                </button>
              </div>
            </li>
          ))}
      </ul>

      {archivedReminders.length > 0 && (
        <section className="stack-archived">
          <button
            type="button"
            className="button-subtle"
            onClick={() => setShowArchived((value) => !value)}
          >
            {showArchived
              ? 'Hide archived'
              : `Show archived (${archivedReminders.length})`}
          </button>
          {showArchived && (
            <ul className="stack-list">
              {archivedReminders.map((reminder) => (
                <li
                  key={reminder.id}
                  className="stack-item stack-item-archived"
                >
                  <div className="stack-item-info">
                    <span className="stack-item-name">{reminder.text}</span>
                    <span className="stack-item-detail">
                      {detail(reminder)}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="button-subtle"
                    onClick={() => unarchiveReminder(reminder.id)}
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
