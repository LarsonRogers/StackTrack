// tests/healthEvents.test.tsx — UI flow: log a health event for the day on
// the Today screen and remove it. Persistence rules are covered by
// healthEventRepository.test.ts.
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../src/App'
import { db } from '../src/db/db'

beforeEach(async () => {
  await db.items.clear()
  await db.healthEvents.clear()
  await db.tombstones.clear()
})

afterEach(cleanup)

describe('Today screen events', () => {
  it('adds an event with a category and lists it, then removes it', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.type(await screen.findByLabelText('Event'), 'Fever')
    await user.selectOptions(screen.getByLabelText('Category'), 'symptom')
    await user.click(screen.getByRole('button', { name: 'Add' }))

    expect(await screen.findByText('Fever')).toBeInTheDocument()
    // scope to the badge — "Symptom" also appears as a <select> option
    expect(
      screen.getByText('Symptom', { selector: '.event-badge' }),
    ).toBeInTheDocument()
    expect(await db.healthEvents.count()).toBe(1)

    await user.click(screen.getByRole('button', { name: 'Remove Fever' }))

    await waitFor(() =>
      expect(screen.queryByText('Fever')).not.toBeInTheDocument(),
    )
    expect(await db.healthEvents.count()).toBe(0)
  })
})
