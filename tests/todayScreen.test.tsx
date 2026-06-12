// tests/todayScreen.test.tsx — UI flow tests for the Today checklist:
// items appear under their scheduled times, tapping toggles taken state,
// and a per-item daily note can be added. Persistence details are covered
// by intakeRepository.test.ts.
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../src/App'
import { db } from '../src/db/db'
import { addItem } from '../src/db/stackRepository'

beforeEach(async () => {
  await db.items.clear()
  await db.stackEvents.clear()
  await db.intakes.clear()
  await db.itemNotes.clear()
})

afterEach(cleanup)

describe('Today checklist', () => {
  it('lists an item under each of its scheduled times', async () => {
    await addItem({
      name: 'Zinc',
      kind: 'supplement',
      dose: '25 mg',
      times: ['08:00', '20:00'],
    })
    render(<App />)

    expect(await screen.findAllByText('Zinc')).toHaveLength(2)
    expect(screen.getByText('0 of 2 taken')).toBeInTheDocument()
  })

  it('marks an item taken on tap and undoes on second tap', async () => {
    await addItem({
      name: 'Zinc',
      kind: 'supplement',
      dose: '25 mg',
      times: ['08:00'],
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
    })
    const user = userEvent.setup()
    render(<App />)

    await user.click(await screen.findByRole('button', { name: 'Note' }))
    await user.type(screen.getByLabelText('Note for Zinc'), 'ran out of pills')
    await user.click(screen.getByRole('button', { name: 'Save note' }))

    expect(await screen.findByText('ran out of pills')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Edit note' }),
    ).toBeInTheDocument()
  })
})
