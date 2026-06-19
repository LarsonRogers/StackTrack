// tests/stackScreen.test.tsx — UI flow tests for the Stack screen: the user
// can navigate to it, add an item through the form, and see it listed under
// its group. Persistence details are covered by stackRepository.test.ts.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
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

    await user.click(await screen.findByRole('button', { name: 'Settings' }))
    await user.click(screen.getByRole('button', { name: 'Stack' }))

    expect(await screen.findByText('Nothing here yet.')).toBeInTheDocument()
  })

  it('adds an item via the form and lists it under its group', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(await screen.findByRole('button', { name: 'Settings' }))
    await user.click(screen.getByRole('button', { name: 'Stack' }))
    await user.click(
      await screen.findByRole('button', {
        name: '+ Add medication or supplement',
      }),
    )

    await user.type(screen.getByLabelText('Name'), 'Zinc')
    await user.type(screen.getByLabelText('Dose'), '25 mg')
    // Groups are tag chips: type a name and press Enter to commit it.
    await user.type(
      screen.getByLabelText('Groups (optional)'),
      'Testosterone Support{Enter}',
    )
    await user.click(screen.getByRole('button', { name: 'Add to stack' }))

    // back on the list — the new item appears under its group section
    expect(await screen.findByText('Zinc')).toBeInTheDocument()
    expect(screen.getByText('Testosterone Support')).toBeInTheDocument()
    expect(screen.getByText(/25 mg/)).toBeInTheDocument()
  })

  it('shows refill runway for an item with a tracked count', async () => {
    const user = userEvent.setup()
    await addItem({
      name: 'Magnesium',
      kind: 'supplement',
      dose: '200 mg',
      times: ['08:00'],
      groups: [],
      quantityOnHand: 10, // 1/day from today → 10 days left
    })
    render(<App />)

    await user.click(await screen.findByRole('button', { name: 'Settings' }))
    await user.click(screen.getByRole('button', { name: 'Stack' }))

    expect(await screen.findByText('≈10 days left')).toBeInTheDocument()
  })

  it('puts an item in multiple groups and marks it across sections', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(await screen.findByRole('button', { name: 'Settings' }))
    await user.click(screen.getByRole('button', { name: 'Stack' }))
    await user.click(
      await screen.findByRole('button', {
        name: '+ Add medication or supplement',
      }),
    )

    await user.type(screen.getByLabelText('Name'), 'Vitamin D')
    await user.type(screen.getByLabelText('Dose'), '2000 IU')
    const groupInput = screen.getByLabelText('Groups (optional)')
    await user.type(groupInput, 'Bone{Enter}')
    // chip appears (wait for the state update) before adding the second
    expect(
      await screen.findByLabelText('Remove group Bone'),
    ).toBeInTheDocument()
    await user.type(groupInput, 'Immune{Enter}')
    expect(
      await screen.findByLabelText('Remove group Immune'),
    ).toBeInTheDocument()
    expect(screen.getByLabelText('Remove group Bone')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Add to stack' }))

    // Back on the list: the item is listed under BOTH sections (Vitamin D is
    // only a list entry now — not a chip — so its count is unambiguous), each
    // marked "in 2 groups" so it reads as one item, not a duplicate.
    await waitFor(() =>
      expect(screen.getAllByText('Vitamin D')).toHaveLength(2),
    )
    expect(screen.getByText('Bone')).toBeInTheDocument()
    expect(screen.getByText('Immune')).toBeInTheDocument()
    expect(screen.getAllByText(/in 2 groups/)).toHaveLength(2)
  })

  it('saves an optional unit and persistent note from the form', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(await screen.findByRole('button', { name: 'Settings' }))
    await user.click(screen.getByRole('button', { name: 'Stack' }))
    await user.click(
      await screen.findByRole('button', {
        name: '+ Add medication or supplement',
      }),
    )

    await user.type(screen.getByLabelText('Name'), 'Zinc')
    await user.type(screen.getByLabelText('Dose'), '500')
    await user.type(screen.getByLabelText('Unit (optional)'), 'mg')
    await user.type(screen.getByLabelText('Note (optional)'), 'take with food')
    await user.click(screen.getByRole('button', { name: 'Add to stack' }))

    expect(await screen.findByText('Zinc')).toBeInTheDocument()
    expect(screen.getByText(/500 mg/)).toBeInTheDocument()
    expect(screen.getByText('take with food')).toBeInTheDocument()
  })

  it('rejects an empty name with an inline error', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(await screen.findByRole('button', { name: 'Settings' }))
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
      groups: ['Testosterone Support'],
    })
    await addItem({
      name: 'Creatine',
      kind: 'supplement',
      dose: '5 g',
      times: ['08:00'],
      groups: ['Performance'],
    })
    const user = userEvent.setup()
    render(<App />)
    await user.click(await screen.findByRole('button', { name: 'Settings' }))
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
      groups: ['Testosterone Support'],
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
    await user.click(await screen.findByRole('button', { name: 'Settings' }))
    await user.click(screen.getByRole('button', { name: 'Stack' }))
    await user.upload(await screen.findByLabelText('Sync from file'), file)

    expect(
      await screen.findByText('Synced: 1 added, 0 updated.'),
    ).toBeInTheDocument()
    expect(await screen.findByText('Magnesium')).toBeInTheDocument()
    expect(screen.getByText('Zinc')).toBeInTheDocument() // local data survives
  })
})
