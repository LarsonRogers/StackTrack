// tests/dayNote.test.tsx — behavior tests for the day-level journal
// (one note per date, replace, clear) and the Today screen journal flow.
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../src/App'
import { db } from '../src/db/db'
import { setDayNote } from '../src/db/dayNoteRepository'

const TODAY = '2026-06-11'
const YESTERDAY = '2026-06-10'

beforeEach(async () => {
  await db.items.clear()
  await db.stackEvents.clear()
  await db.intakes.clear()
  await db.itemNotes.clear()
  await db.metrics.clear()
  await db.metricEntries.clear()
  await db.dayNotes.clear()
})

afterEach(cleanup)

describe('setDayNote', () => {
  it('saves one note per day and replaces on re-save', async () => {
    await setDayNote(TODAY, 'slept badly')
    await setDayNote(TODAY, 'slept badly, stressful day')

    const notes = await db.dayNotes.toArray()
    expect(notes).toHaveLength(1)
    expect(notes[0].text).toBe('slept badly, stressful day')
  })

  it('keeps different days separate', async () => {
    await setDayNote(YESTERDAY, 'rough day')
    await setDayNote(TODAY, 'better')

    expect(await db.dayNotes.count()).toBe(2)
  })

  it('clears the note when text is empty or whitespace', async () => {
    await setDayNote(TODAY, 'something')
    await setDayNote(TODAY, '   ')

    expect(await db.dayNotes.count()).toBe(0)
  })
})

describe('Today screen journal', () => {
  it('saves a journal entry for the day', async () => {
    const user = userEvent.setup()
    render(<App />)

    const textarea = await screen.findByLabelText('Note about your day')
    await user.type(textarea, 'stressful day at work')
    await user.click(screen.getByRole('button', { name: 'Save journal' }))

    expect(await screen.findByText('Saved')).toBeInTheDocument()
    const notes = await db.dayNotes.toArray()
    expect(notes).toHaveLength(1)
    expect(notes[0].text).toBe('stressful day at work')
  })
})
