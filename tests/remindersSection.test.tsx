// tests/remindersSection.test.tsx — the Today advisory: a due reminder shows
// and can be dismissed (Done) or snoozed. Renders the whole app so the wiring
// (TodayScreen → RemindersSection → repository) is exercised end to end.
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../src/App'
import { db } from '../src/db/db'
import { addReminder } from '../src/db/reminderRepository'
import { toIsoDate } from '../src/lib/dates'

const today = toIsoDate(new Date())

beforeEach(async () => {
  await db.reminders.clear()
  await db.items.clear()
  localStorage.clear()
})

afterEach(cleanup)

describe('Today reminders advisory', () => {
  it('shows a due reminder and Done dismisses it', async () => {
    const user = userEvent.setup()
    await addReminder({
      text: 'Take blood test',
      recurrence: { kind: 'once', date: today },
    })
    render(<App />)

    expect(await screen.findByText('Take blood test')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Done' }))
    await waitFor(() =>
      expect(screen.queryByText('Take blood test')).not.toBeInTheDocument(),
    )
  })

  it('snoozes a due reminder so it leaves the advisory', async () => {
    const user = userEvent.setup()
    await addReminder({
      text: 'Refill prescription',
      recurrence: { kind: 'everyNDays', n: 1, startDate: today },
    })
    render(<App />)

    expect(await screen.findByText('Refill prescription')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Snooze' }))
    await user.click(screen.getByRole('button', { name: 'Apply' }))
    await waitFor(() =>
      expect(screen.queryByText('Refill prescription')).not.toBeInTheDocument(),
    )
  })
})
