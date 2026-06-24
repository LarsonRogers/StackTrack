// tests/adherenceScreen.test.tsx — UI flow for the Adherence view (#28):
// reachable from the bottom-bar tab, shows overall % + per-item rows, and an
// empty state when the stack is empty. The detailed math is covered by
// adherence.test.ts; this asserts the screen wires data through correctly.
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../src/App'
import { db } from '../src/db/db'
import { addItem } from '../src/db/stackRepository'
import { markTaken } from '../src/db/intakeRepository'
import { toIsoDate } from '../src/lib/dates'

beforeEach(async () => {
  await db.items.clear()
  await db.stackEvents.clear()
  await db.intakes.clear()
})

afterEach(cleanup)

async function gotoAdherence(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: 'Adherence' }))
}

describe('Adherence screen', () => {
  it('shows an empty state when the stack has no active items', async () => {
    const user = userEvent.setup()
    render(<App />)
    await gotoAdherence(user)
    expect(
      await screen.findByText(/Add medications .* to see adherence/),
    ).toBeInTheDocument()
  })

  it('reports overall %, a per-item row, and a streak', async () => {
    const today = toIsoDate(new Date())
    const id = await addItem({
      name: 'Zinc',
      kind: 'supplement',
      dose: '1',
      times: ['08:00'],
      groups: [],
    })
    await markTaken(id, today, '08:00')

    const user = userEvent.setup()
    render(<App />)
    await gotoAdherence(user)

    // The overall total and the single item both read 100%.
    expect(await screen.findByText('1 of 1 doses taken')).toBeInTheDocument()
    expect(screen.getAllByText('100%')).toHaveLength(2)
    expect(screen.getByText('Zinc')).toBeInTheDocument()
    expect(screen.getByText('1 / 1 doses')).toBeInTheDocument()
    expect(screen.getByText('1-day streak')).toBeInTheDocument()
  })

  it('reflects a missed dose in the overall percentage', async () => {
    const today = toIsoDate(new Date())
    const taken = await addItem({
      name: 'Apple',
      kind: 'supplement',
      dose: '1',
      times: ['08:00'],
      groups: [],
    })
    await addItem({
      name: 'Boron',
      kind: 'supplement',
      dose: '1',
      times: ['08:00'],
      groups: [],
    })
    await markTaken(taken, today, '08:00') // 1 of 2 items taken today

    const user = userEvent.setup()
    render(<App />)
    await gotoAdherence(user)

    expect(await screen.findByText('50%')).toBeInTheDocument()
  })
})
