// tests/settingsMenu.test.tsx — the navigation split: the bottom bar holds the
// "view" screens (Today, Graphs); the settings cog opens the "set up" screens
// (Stack, Tracking, Sync). Covers opening the menu, navigating, and closing.
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../src/App'
import { db } from '../src/db/db'

beforeEach(async () => {
  await db.items.clear()
  await db.metrics.clear()
  localStorage.clear()
})

afterEach(cleanup)

describe('navigation: bottom bar + settings cog', () => {
  it('keeps only the view screens in the bottom bar', () => {
    render(<App />)
    const nav = screen.getByRole('navigation', { name: 'Main' })
    // Today + Graphs live in the bottom bar; setup screens do not.
    expect(nav).toHaveTextContent('Today')
    expect(nav).toHaveTextContent('Graphs')
    expect(nav).not.toHaveTextContent('Stack')
    expect(nav).not.toHaveTextContent('Sync')
  })

  it('opens the cog menu and navigates to a setup screen', async () => {
    const user = userEvent.setup()
    render(<App />)

    // Closed by default — no menu items visible.
    expect(
      screen.queryByRole('button', { name: 'Stack' }),
    ).not.toBeInTheDocument()

    await user.click(await screen.findByRole('button', { name: 'Settings' }))
    expect(screen.getByRole('button', { name: 'Tracking' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Stack' }))
    // Landed on the Stack screen; the menu closed behind us.
    expect(
      await screen.findByRole('heading', { name: 'Your Stack' }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Stack' }),
    ).not.toBeInTheDocument()
  })

  it('closes the menu on Escape', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(await screen.findByRole('button', { name: 'Settings' }))
    expect(screen.getByRole('button', { name: 'Sync' })).toBeInTheDocument()

    await user.keyboard('{Escape}')
    expect(
      screen.queryByRole('button', { name: 'Sync' }),
    ).not.toBeInTheDocument()
  })

  it('closes the menu when the backdrop is clicked', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(await screen.findByRole('button', { name: 'Settings' }))
    expect(screen.getByRole('button', { name: 'Stack' })).toBeInTheDocument()

    await user.click(
      screen.getByRole('button', { name: 'Close settings menu' }),
    )
    expect(
      screen.queryByRole('button', { name: 'Stack' }),
    ).not.toBeInTheDocument()
  })

  it('marks the current screen in the menu', async () => {
    const user = userEvent.setup()
    render(<App />)

    // Navigate to Stack, then reopen the cog from the Stack screen.
    await user.click(await screen.findByRole('button', { name: 'Settings' }))
    await user.click(screen.getByRole('button', { name: 'Stack' }))
    await user.click(await screen.findByRole('button', { name: 'Settings' }))

    expect(screen.getByRole('button', { name: 'Stack' })).toHaveAttribute(
      'aria-current',
      'page',
    )
    expect(screen.getByRole('button', { name: 'Sync' })).not.toHaveAttribute(
      'aria-current',
    )
  })
})
