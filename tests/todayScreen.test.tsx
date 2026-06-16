// tests/todayScreen.test.tsx — UI flow tests for the Today checklist:
// items appear under their scheduled times, tapping toggles taken state,
// and a per-item daily note can be added. Persistence details are covered
// by intakeRepository.test.ts.
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../src/App'
import { db } from '../src/db/db'
import { addItem, archiveItem } from '../src/db/stackRepository'
import { markTaken } from '../src/db/intakeRepository'
import { addDays, toIsoDate } from '../src/lib/dates'

beforeEach(async () => {
  await db.items.clear()
  await db.stackEvents.clear()
  await db.intakes.clear()
  await db.itemNotes.clear()
  await db.tombstones.clear()
})

afterEach(cleanup)

describe('Today checklist', () => {
  it('lists an item under each of its scheduled times', async () => {
    await addItem({
      name: 'Zinc',
      kind: 'supplement',
      dose: '25 mg',
      times: ['08:00', '20:00'],
      groups: [],
    })
    render(<App />)

    expect(await screen.findAllByText('Zinc')).toHaveLength(2)
    expect(screen.getByText('0 of 2 taken')).toBeInTheDocument()
  })

  it('shows the med/supp badge and groups on the card', async () => {
    await addItem({
      name: 'Testosterone',
      kind: 'med',
      dose: '100 mg',
      times: ['08:00'],
      groups: ['Hormones', 'Performance'],
    })
    render(<App />)

    expect(await screen.findByText('Testosterone')).toBeInTheDocument()
    expect(screen.getByText('Med')).toBeInTheDocument()
    expect(screen.getByText(/Hormones, Performance/)).toBeInTheDocument()
  })

  it('marks an item taken on tap and undoes on second tap', async () => {
    await addItem({
      name: 'Zinc',
      kind: 'supplement',
      dose: '25 mg',
      times: ['08:00'],
      groups: [],
    })
    const user = userEvent.setup()
    render(<App />)

    const checkbox = await screen.findByRole('checkbox')
    await user.click(checkbox)
    expect(await screen.findByText('All done for today.')).toBeInTheDocument()
    expect(await db.intakes.count()).toBe(1)

    await user.click(checkbox)
    expect(await screen.findByText('0 of 1 taken')).toBeInTheDocument()
    expect(await db.intakes.count()).toBe(0)
  })

  it('attaches a daily note to an item', async () => {
    await addItem({
      name: 'Zinc',
      kind: 'supplement',
      dose: '25 mg',
      times: ['08:00'],
      groups: [],
    })
    const user = userEvent.setup()
    render(<App />)

    await user.click(await screen.findByRole('button', { name: 'Note' }))
    const textarea = screen.getByLabelText('Note for Zinc')
    await user.type(textarea, 'ran out of pills')
    // Confirm the keystrokes actually landed before saving — under CPU load
    // userEvent typing can lag, and saving an empty draft would *clear* the
    // note instead of setting it.
    await waitFor(() => expect(textarea).toHaveValue('ran out of pills'))

    await user.click(screen.getByRole('button', { name: 'Save note' }))

    // Wait for the unambiguous saved end-state: the editor closes and the
    // button flips to "Edit note" only once the write has committed. (Asserting
    // the note text alone is ambiguous — it also matches the open textarea.)
    expect(
      await screen.findByRole(
        'button',
        { name: 'Edit note' },
        { timeout: 5000 },
      ),
    ).toBeInTheDocument()
    expect(screen.getByText('ran out of pills')).toBeInTheDocument()
  })
})

describe('Date navigation', () => {
  it('cannot navigate into the future', async () => {
    await addItem({
      name: 'Zinc',
      kind: 'supplement',
      dose: '25 mg',
      times: ['08:00'],
      groups: [],
    })
    render(<App />)

    expect(
      await screen.findByRole('button', { name: 'Next day' }),
    ).toBeDisabled()
  })

  it('marks an intake on a past day without touching today', async () => {
    await addItem({
      name: 'Zinc',
      kind: 'supplement',
      dose: '25 mg',
      times: ['08:00'],
      groups: [],
    })
    const user = userEvent.setup()
    render(<App />)

    await user.click(
      await screen.findByRole('button', { name: 'Previous day' }),
    )
    await user.click(await screen.findByRole('checkbox'))

    const intakes = await db.intakes.toArray()
    expect(intakes).toHaveLength(1)
    expect(intakes[0].date).toBe(addDays(toIsoDate(new Date()), -1))

    // back on today, nothing is checked
    await user.click(screen.getByRole('button', { name: 'Back to today' }))
    expect(await screen.findByText('0 of 1 taken')).toBeInTheDocument()
  })

  it('shows records from archived items under "Also recorded this day"', async () => {
    const itemId = await addItem({
      name: 'Boron',
      kind: 'supplement',
      dose: '6 mg',
      times: ['08:00'],
      groups: [],
    })
    const yesterday = addDays(toIsoDate(new Date()), -1)
    await markTaken(itemId, yesterday, '08:00')
    await archiveItem(itemId)

    const user = userEvent.setup()
    render(<App />)
    await user.click(
      await screen.findByRole('button', { name: 'Previous day' }),
    )

    const orphanSection = await screen.findByRole('region', {
      name: 'Also recorded this day',
    })
    expect(orphanSection).toHaveTextContent('Boron')
  })
})
