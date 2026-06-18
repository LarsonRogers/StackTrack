// tests/syncScreen.test.tsx — flow tests for the Sync settings screen:
// setup-form validation, the enable handoff, and the connected view.
// The engine itself is covered by syncEngine.test.ts and is mocked here.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../src/App'
import { db } from '../src/db/db'

vi.mock('../src/lib/syncEngine', () => ({
  enableSync: vi.fn(() => Promise.resolve()),
  disableSync: vi.fn(() => Promise.resolve()),
  runSync: vi.fn(() => Promise.resolve()),
  getSyncStatus: () => ({ state: 'idle' }),
  onSyncStatus: () => () => {},
  initSyncTriggers: vi.fn(),
}))

import { enableSync } from '../src/lib/syncEngine'

beforeEach(async () => {
  await db.items.clear()
  await db.syncState.clear()
})

afterEach(cleanup)

async function openSyncTab() {
  const user = userEvent.setup()
  render(<App />)
  await user.click(await screen.findByRole('button', { name: 'Settings' }))
  await user.click(screen.getByRole('button', { name: 'Sync' }))
  return user
}

describe('Sync screen setup', () => {
  it('shows the no-recovery warning before anything else', async () => {
    await openSyncTab()
    expect(await screen.findByText(/There is no reset/)).toBeInTheDocument()
  })

  it('rejects short and mismatched passphrases without calling the engine', async () => {
    const user = await openSyncTab()

    await user.type(await screen.findByLabelText('Passphrase'), 'short')
    await user.type(screen.getByLabelText('Repeat passphrase'), 'short')
    await user.click(screen.getByRole('button', { name: 'Enable sync' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/at least 8/)

    await user.clear(screen.getByLabelText('Passphrase'))
    await user.clear(screen.getByLabelText('Repeat passphrase'))
    await user.type(screen.getByLabelText('Passphrase'), 'long enough one')
    await user.type(
      screen.getByLabelText('Repeat passphrase'),
      'different one!',
    )
    await user.click(screen.getByRole('button', { name: 'Enable sync' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/don't match/)

    expect(enableSync).not.toHaveBeenCalled()
  })

  it('hands a valid passphrase to the engine', async () => {
    const user = await openSyncTab()

    await user.type(
      await screen.findByLabelText('Passphrase'),
      'amber-falcon-ridge-opal',
    )
    await user.type(
      screen.getByLabelText('Repeat passphrase'),
      'amber-falcon-ridge-opal',
    )
    await user.click(screen.getByRole('button', { name: 'Enable sync' }))

    expect(enableSync).toHaveBeenCalledWith('amber-falcon-ridge-opal')
  })
})

describe('Sync screen connected view', () => {
  it('shows status and actions when sync is configured', async () => {
    await db.syncState.add({
      groupId: 'g',
      authToken: 't',
      encKeyHex: 'aa',
      cursor: 5,
      lastSyncedAt: '2026-06-12T10:00:00.000Z',
    } as never)

    await openSyncTab()

    expect(await screen.findByText('Connected')).toBeInTheDocument()
    expect(screen.getByText(/Last synced/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Sync now' })).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Disconnect this device' }),
    ).toBeInTheDocument()
  })
})
