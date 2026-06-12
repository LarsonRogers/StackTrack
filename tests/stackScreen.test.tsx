// tests/stackScreen.test.tsx — UI flow tests for the Stack screen: the user
// can navigate to it, add an item through the form, and see it listed under
// its group. Persistence details are covered by stackRepository.test.ts.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../src/App'
import { db } from '../src/db/db'
import { addItem } from '../src/db/stackRepository'

beforeEach(async () => {
  await db.items.clear()
  await db.stackEvents.clear()
  localStorage.clear()
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

  it('switches between grouped and flat sort modes and remembers the choice', async () => {
    await addItem({
      name: 'Zinc',
      kind: 'supplement',
      dose: '25 mg',
      times: ['20:00'],
      group: 'Testosterone Support',
    })
    await addItem({
      name: 'Creatine',
      kind: 'supplement',
      dose: '5 g',
      times: ['08:00'],
      group: 'Performance',
    })
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'Stack' }))

    // default: grouped sections
    expect(await screen.findByText('Performance')).toBeInTheDocument()

    await user.selectOptions(screen.getByLabelText('Sort by'), 'time')

    // flat list: section headers gone, group shown inline in the detail line
    expect(screen.queryByRole('heading', { name: 'Performance' })).toBeNull()
    expect(screen.getByText(/5 g · 08:00 · Performance/)).toBeInTheDocument()
    expect(localStorage.getItem('stacktrack.stackSortMode')).toBe('time')
  })

  it('merges a sync file from another device', async () => {
    await addItem({
      name: 'Zinc',
      kind: 'supplement',
      dose: '25 mg',
      times: ['08:00'],
      group: 'Testosterone Support',
    })
    const phoneBundle = {
      app: 'StackTrack',
      exportedAt: '2026-06-12T10:00:00.000Z',
      schemaVersion: 5,
      data: {
        items: [
          {
            id: 1,
            uid: 'phone-item-uid',
            name: 'Magnesium',
            kind: 'supplement',
            dose: '400 mg',
            times: ['20:00'],
            status: 'active',
            createdAt: '2026-06-10T08:00:00.000Z',
            updatedAt: '2026-06-10T08:00:00.000Z',
          },
        ],
      },
    }
    const file = new File([JSON.stringify(phoneBundle)], 'sync.json', {
      type: 'application/json',
    })
    vi.spyOn(window, 'confirm').mockReturnValue(true)

    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'Stack' }))
    await user.upload(await screen.findByLabelText('Sync from file'), file)

    expect(
      await screen.findByText('Synced: 1 added, 0 updated.'),
    ).toBeInTheDocument()
    expect(await screen.findByText('Magnesium')).toBeInTheDocument()
    expect(screen.getByText('Zinc')).toBeInTheDocument() // local data survives
  })
})
