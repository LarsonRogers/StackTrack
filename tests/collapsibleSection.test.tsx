// tests/collapsibleSection.test.tsx — Today-screen sections collapse and the
// open/closed choice is remembered (localStorage) across a fresh render.
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../src/App'
import { db } from '../src/db/db'

beforeEach(async () => {
  await db.items.clear()
  await db.healthEvents.clear()
  localStorage.clear()
})

afterEach(cleanup)

describe('collapsible Today sections', () => {
  it('collapses a section and hides its body', async () => {
    const user = userEvent.setup()
    render(<App />)

    const toggle = await screen.findByRole('button', { name: 'Events' })
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByLabelText('Event')).toBeInTheDocument() // body visible

    await user.click(toggle)

    expect(screen.getByRole('button', { name: 'Events' })).toHaveAttribute(
      'aria-expanded',
      'false',
    )
    expect(screen.queryByLabelText('Event')).not.toBeInTheDocument()
  })

  it('remembers the collapsed state across a fresh render', async () => {
    const user = userEvent.setup()
    const first = render(<App />)
    await user.click(await screen.findByRole('button', { name: 'Events' }))
    first.unmount()

    render(<App />)
    expect(
      await screen.findByRole('button', { name: 'Events' }),
    ).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByLabelText('Event')).not.toBeInTheDocument()
  })
})
