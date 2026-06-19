// tests/remindersScreen.test.tsx — the manage-reminders screen's per-occurrence
// history (#25 Task C): once a reminder has logged actions, it can be expanded
// to show each past Done/Snooze with the occurrence it acted on.
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import RemindersScreen from '../src/screens/RemindersScreen'
import { db } from '../src/db/db'
import {
  acknowledgeReminder,
  addReminder,
  snoozeReminder,
} from '../src/db/reminderRepository'

const TODAY = '2026-06-18'

beforeEach(async () => {
  await db.reminders.clear()
  await db.reminderEvents.clear()
  await db.items.clear()
})

afterEach(cleanup)

describe('RemindersScreen per-occurrence history', () => {
  it('hides the history toggle until a reminder has events', async () => {
    await addReminder({
      text: 'Refill prescription',
      recurrence: { kind: 'everyNDays', n: 7, startDate: '2026-06-01' },
    })
    render(<RemindersScreen />)

    expect(await screen.findByText('Refill prescription')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /History/ })).toBeNull()
  })

  it('expands to show each logged action, newest first', async () => {
    const user = userEvent.setup()
    const id = await addReminder({
      text: 'Weekly vitamins',
      recurrence: { kind: 'everyNDays', n: 7, startDate: '2026-06-01' },
    })
    await snoozeReminder(id, TODAY, 2)
    await acknowledgeReminder(id, TODAY)
    render(<RemindersScreen />)

    const toggle = await screen.findByRole('button', { name: 'History (2)' })
    await user.click(toggle)

    expect(screen.getByText('Done')).toBeInTheDocument()
    expect(screen.getByText('Snoozed until 2026-06-20')).toBeInTheDocument()
    // both actions resolved to the same current occurrence
    expect(screen.getAllByText('2026-06-15')).toHaveLength(2)

    await user.click(screen.getByRole('button', { name: 'Hide history' }))
    expect(screen.queryByText('Done')).toBeNull()
  })
})
