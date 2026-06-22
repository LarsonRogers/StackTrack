// src/components/StackChangeNote.tsx — the "why" note on one row of the Graphs
// stack-change list: the reasoning behind a change. A row may collapse several
// same-day changes that share one note, so every underlying event id is written
// together (setEventNote). The saved value comes from the parent marker (a live
// query), so this component owns only the in-progress draft and a "Saved" flash
// — mirroring JournalSection. Reading/writing both go through the repository.
import { useId, useState } from 'react'
import { setEventNote } from '../db/stackRepository'

interface StackChangeNoteProps {
  eventIds: number[]
  note?: string // the saved note for this row, or undefined if none
  label: string // the change label, for accessible control names
}

export default function StackChangeNote({
  eventIds,
  note,
  label,
}: StackChangeNoteProps) {
  const textareaId = useId()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const [saving, setSaving] = useState(false)
  const [justSaved, setJustSaved] = useState(false)
  const [error, setError] = useState(false)

  function startEditing() {
    setDraft(note ?? '')
    setEditing(true)
    setJustSaved(false)
    setError(false)
  }

  // Only confirm "Saved" and close the editor if the write actually succeeds —
  // this is sensitive reasoning, so a failed write must never look saved. The
  // saving guard also blocks a double-tap from firing two overlapping writes.
  async function handleSave() {
    if (saving) return
    setSaving(true)
    setError(false)
    try {
      await setEventNote(eventIds, draft)
      setEditing(false)
      setJustSaved(true)
      setTimeout(() => setJustSaved(false), 2000)
    } catch {
      setError(true) // keep the editor open with the draft intact
    } finally {
      setSaving(false)
    }
  }

  if (editing) {
    return (
      <div className="stack-change-note">
        <label className="visually-hidden" htmlFor={textareaId}>
          Note for {label}
        </label>
        <textarea
          id={textareaId}
          rows={2}
          value={draft}
          placeholder="Why this change? e.g. after bloodwork, doctor's advice…"
          onChange={(e) => setDraft(e.target.value)}
        />
        <div className="today-note-actions">
          <button
            type="button"
            className="button-primary button-compact"
            onClick={handleSave}
            disabled={saving}
          >
            Save note
          </button>
          <button
            type="button"
            className="button-subtle"
            onClick={() => setEditing(false)}
          >
            Cancel
          </button>
        </div>
        {error && (
          <p className="stack-change-note-error" role="alert">
            Couldn’t save the note — please try again.
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="stack-change-note">
      {note && <p className="stack-change-note-text">{note}</p>}
      <div className="today-note-actions">
        <button type="button" className="button-subtle" onClick={startEditing}>
          {note ? 'Edit note' : 'Add note'}
        </button>
        {justSaved && <span className="metric-number-saved">Saved</span>}
      </div>
    </div>
  )
}
