// src/screens/TodayScreen.tsx — the "Today" view: the daily check-in.
// Active items appear under each of their scheduled times; tapping toggles
// taken/not-taken (intakeRepository), and each item can carry one note for
// the day (itemNoteRepository). Reads are live; all writes go through the
// repositories — this screen never touches the stack tables.
import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, type ItemNote } from '../db/db'
import { markTaken, unmarkTaken } from '../db/intakeRepository'
import { setItemNote } from '../db/itemNoteRepository'
import { formatTime, formatTodayHeading, toIsoDate } from '../lib/dates'
import { buildTimeSections, type ChecklistEntry } from '../lib/todayView'
import MetricLogger from '../components/MetricLogger'
import JournalSection from '../components/JournalSection'

export default function TodayScreen() {
  const today = toIsoDate(new Date())
  const items = useLiveQuery(
    () => db.items.where('status').equals('active').toArray(),
    [],
  )
  const intakes = useLiveQuery(
    () => db.intakes.where('date').equals(today).toArray(),
    [today],
  )
  const notes = useLiveQuery(
    () => db.itemNotes.where('date').equals(today).toArray(),
    [today],
  )
  const metrics = useLiveQuery(
    () => db.metrics.where('status').equals('active').toArray(),
    [],
  )
  const metricEntries = useLiveQuery(
    () => db.metricEntries.where('date').equals(today).toArray(),
    [today],
  )
  // Which item's note is being edited (keyed to the row that opened it,
  // since an item can appear at several times), and the in-progress text
  const [noteEditor, setNoteEditor] = useState<{
    itemId: number
    time: string
    draft: string
  } | null>(null)

  if (
    items === undefined ||
    intakes === undefined ||
    notes === undefined ||
    metrics === undefined ||
    metricEntries === undefined
  )
    return null

  const sections = buildTimeSections(items)
  const takenKeys = new Set(intakes.map((i) => `${i.itemId}@${i.time}`))
  const notesByItem = new Map(notes.map((note) => [note.itemId, note]))
  const totalSlots = sections.reduce((sum, s) => sum + s.entries.length, 0)
  const takenCount = sections.reduce(
    (sum, s) =>
      sum +
      s.entries.filter((e) => takenKeys.has(`${e.item.id}@${e.time}`)).length,
    0,
  )

  async function toggleTaken(entry: ChecklistEntry, taken: boolean) {
    if (taken) {
      await unmarkTaken(entry.item.id, today, entry.time)
    } else {
      await markTaken(entry.item.id, today, entry.time)
    }
  }

  async function saveNote() {
    if (!noteEditor) return
    await setItemNote(noteEditor.itemId, today, noteEditor.draft)
    setNoteEditor(null)
  }

  function openNoteEditor(
    entry: ChecklistEntry,
    existing: ItemNote | undefined,
  ) {
    setNoteEditor({
      itemId: entry.item.id,
      time: entry.time,
      draft: existing?.text ?? '',
    })
  }

  return (
    <main className="today">
      <header className="today-header">
        <h1>StackTrack</h1>
        <p className="today-date">{formatTodayHeading(new Date())}</p>
      </header>

      {totalSlots === 0 ? (
        <section className="today-empty" aria-label="Today's checklist">
          <h2>Today</h2>
          <p>Nothing to take yet — your stack is empty.</p>
          <p className="today-hint">
            Add medications &amp; supplements in the Stack tab below.
          </p>
        </section>
      ) : (
        <>
          <p className="today-progress" role="status">
            {takenCount === totalSlots
              ? 'All done for today.'
              : `${takenCount} of ${totalSlots} taken`}
          </p>

          {sections.map((section) => (
            <section key={section.time} className="today-section">
              <h2 className="today-section-title">
                {formatTime(section.time)}
              </h2>
              <ul className="today-list">
                {section.entries.map((entry) => {
                  const taken = takenKeys.has(`${entry.item.id}@${entry.time}`)
                  const note = notesByItem.get(entry.item.id)
                  const isEditingNote =
                    noteEditor?.itemId === entry.item.id &&
                    noteEditor.time === entry.time
                  return (
                    <li
                      key={`${entry.item.id}@${entry.time}`}
                      className="today-item"
                    >
                      <div className="today-item-row">
                        <label className="today-item-check">
                          <input
                            type="checkbox"
                            checked={taken}
                            onChange={() => toggleTaken(entry, taken)}
                          />
                          <span
                            className={
                              taken
                                ? 'today-item-name today-item-taken'
                                : 'today-item-name'
                            }
                          >
                            {entry.item.name}
                          </span>
                          <span className="today-item-detail">
                            {entry.item.dose}
                          </span>
                        </label>
                        <button
                          type="button"
                          className="button-subtle"
                          onClick={() => openNoteEditor(entry, note)}
                        >
                          {note ? 'Edit note' : 'Note'}
                        </button>
                      </div>

                      {note && !isEditingNote && (
                        <p className="today-item-note">{note.text}</p>
                      )}

                      {isEditingNote && (
                        <div className="today-note-editor">
                          <label
                            className="visually-hidden"
                            htmlFor={`note-${entry.item.id}`}
                          >
                            Note for {entry.item.name}
                          </label>
                          <textarea
                            id={`note-${entry.item.id}`}
                            rows={2}
                            value={noteEditor.draft}
                            placeholder="e.g. ran out of pills"
                            onChange={(e) =>
                              setNoteEditor({
                                itemId: entry.item.id,
                                time: entry.time,
                                draft: e.target.value,
                              })
                            }
                          />
                          <div className="today-note-actions">
                            <button
                              type="button"
                              className="button-primary button-compact"
                              onClick={saveNote}
                            >
                              Save note
                            </button>
                            <button
                              type="button"
                              className="button-subtle"
                              onClick={() => setNoteEditor(null)}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </li>
                  )
                })}
              </ul>
            </section>
          ))}
        </>
      )}

      {metrics.length > 0 && (
        <section className="today-section" aria-label="Daily metrics">
          <h2 className="today-section-title">Daily metrics</h2>
          <ul className="today-list">
            {metrics
              .toSorted((a, b) => a.name.localeCompare(b.name))
              .map((metric) => (
                <MetricLogger
                  key={metric.id}
                  metric={metric}
                  entry={metricEntries.find((e) => e.metricId === metric.id)}
                  date={today}
                />
              ))}
          </ul>
        </section>
      )}

      <JournalSection date={today} />
    </main>
  )
}
