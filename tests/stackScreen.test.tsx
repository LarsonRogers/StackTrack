// tests/stackScreen.test.tsx — UI flow tests for the Stack screen: the user
// can navigate to it, add an item through the form, and see it listed under
// its group. Persistence details are covered by stackRepository.test.ts.
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../src/App'
import { db } from '../src/db/db'

beforeEach(async () => {
  await db.items.clear()
  await db.stackEvents.clear()
})

afterEach(cleanup)

describe('Stack screen', () => {
  it('shows the empty state when the stack has no items', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: 'Stack' }))

    expect(await screen.findByText('Nothing here yet.')).toBeInTheDocument()
  })

  it('adds an item via the form and lists it under its group', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: 'Stack' }))
    await user.click(
      await screen.findByRole('button', {
        name: '+ Add medication or supplement',
      }),
    )

    await user.type(screen.getByLabelText('Name'), 'Zinc')
    await user.type(screen.getByLabelText('Dose'), '25 mg')
    await user.type(
      screen.getByLabelText('Group (optional)'),
      'Testosterone Support',
    )
    await user.click(screen.getByRole('button', { name: 'Add to stack' }))

    // back on the list — the new item appears under its group section
    expect(await screen.findByText('Zinc')).toBeInTheDocument()
    expect(screen.getByText('Testosterone Support')).toBeInTheDocument()
    expect(screen.getByText(/25 mg/)).toBeInTheDocument()
  })

  it('rejects an empty name with an inline error', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: 'Stack' }))
    await user.click(
      await screen.findByRole('button', {
        name: '+ Add medication or supplement',
      }),
    )
    await user.click(screen.getByRole('button', { name: 'Add to stack' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Please enter a name.',
    )
  })
})
