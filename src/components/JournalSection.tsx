// src/components/JournalSection.tsx — the day-level journal on the Today
// screen: one free-text note for the date as a whole. Reads live; writes
// through dayNoteRepository. The draft is kept locally while typing and a
// "Saved" flash confirms persistence.
import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import { setDayNote } from '../db/dayNoteRepository'

interface JournalSectionProps {
  date: string // local 'YYYY-MM-DD'
}

export default function JournalSection({ date }: JournalSectionProps) {
  // undefined = query still resolving; null = resolved, no note for this day
  // (first() alone can't tell those apart, hence the ?? null)
  const savedNote = useLiveQuery(
    async () => (await db.dayNotes.where('date').equals(date).first()) ?? null,
    [date],
  )
  // null = not editing (mirror saved text); string = user's in-progress draft
  const [draft, setDraft] = useState<string | null>(null)
  const [justSaved, setJustSaved] = useState(false)

  if (savedNote === undefined) return null

  const text = draft ?? savedNote?.text ?? ''

  async function handleSave() {
    await setDayNote(date, text)
    setDraft(null)
    setJustSaved(true)
    setTimeout(() => setJustSaved(false), 2000)
  }

  return (
    <section className="today-section journal" aria-label="Journal">
      <h2 className="today-section-title">Journal</h2>
      <label className="visually-hidden" htmlFor="journal-text">
        Note about your day
      </label>
      <textarea
        id="journal-text"
        rows={3}
        value={text}
        placeholder="How was your day? Sleep, stress, anything worth remembering…"
        onChange={(e) => {
          setDraft(e.target.value)
          setJustSaved(false)
        }}
      />
      <div className="today-note-actions">
        <button
          type="button"
          className="button-primary button-compact"
          onClick={handleSave}
          disabled={draft === null}
        >
          Save journal
        </button>
        {justSaved && <span className="metric-number-saved">Saved</span>}
      </div>
    </section>
  )
}
