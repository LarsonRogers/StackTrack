// tests/graphsScreen.test.tsx — flow tests for the Graphs screen: metric
// selection, the collapsed stack-change legend, and empty states. Chart
// pixel output isn't asserted (jsdom has no layout); the shaping logic is
// covered by graphView.test.ts and the visual result by the demo gate.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../src/App'
import { db } from '../src/db/db'
import StackChangeNote from '../src/components/StackChangeNote'
import * as stackRepo from '../src/db/stackRepository'
import { addItem } from '../src/db/stackRepository'
import { addMetric } from '../src/db/metricRepository'
import { setMetricEntry } from '../src/db/metricEntryRepository'
import { addHealthEvent } from '../src/db/healthEventRepository'
import { toIsoDate } from '../src/lib/dates'

beforeEach(async () => {
  await db.items.clear()
  await db.stackEvents.clear()
  await db.intakes.clear()
  await db.itemNotes.clear()
  await db.metrics.clear()
  await db.metricEntries.clear()
  await db.dayNotes.clear()
  await db.healthEvents.clear()
})

afterEach(cleanup)

async function openGraphsTab() {
  const user = userEvent.setup()
  render(<App />)
  await user.click(screen.getByRole('button', { name: 'Graphs' }))
  return user
}

describe('Graphs screen', () => {
  it('points to the Tracking tab when no metric exists', async () => {
    await openGraphsTab()
    expect(
      await screen.findByText(/Define a metric on the Tracking tab/),
    ).toBeInTheDocument()
  })

  it('lists collapsed stack changes for the selected range', async () => {
    await addMetric({ name: 'Energy', kind: 'rating' })
    await setMetricEntry(1, toIsoDate(new Date()), 7)
    // two same-group items added today → one collapsed legend row
    await addItem({
      name: 'Zinc',
      kind: 'supplement',
      dose: '25 mg',
      times: ['08:00'],
      groups: ['Testosterone Support'],
    })
    await addItem({
      name: 'Magnesium',
      kind: 'supplement',
      dose: '400 mg',
      times: ['20:00'],
      groups: ['Testosterone Support'],
    })

    await openGraphsTab()

    expect(
      await screen.findByText('Started Testosterone Support (2 items)'),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('region', { name: 'Stack changes' }),
    ).toBeInTheDocument()
  })

  it('attaches a note to a stack change from the change list', async () => {
    const metricId = await addMetric({ name: 'Energy', kind: 'rating' })
    await setMetricEntry(metricId, toIsoDate(new Date()), 7)
    await addItem({
      name: 'Zinc',
      kind: 'supplement',
      dose: '25 mg',
      times: ['08:00'],
      groups: [],
    })

    const user = await openGraphsTab()
    await user.click(await screen.findByRole('button', { name: 'Add note' }))
    await user.type(
      screen.getByRole('textbox', { name: 'Note for Started Zinc' }),
      'started after bloodwork',
    )
    await user.click(screen.getByRole('button', { name: 'Save note' }))

    // The editor closes and the row now shows the saved note + an Edit control
    // (the live query re-emits, so the note flows back down from the parent).
    expect(
      await screen.findByRole('button', { name: 'Edit note' }),
    ).toBeInTheDocument()
    expect(screen.getByText('started after bloodwork')).toBeInTheDocument()
    // ...and it persisted on the underlying event.
    await waitFor(async () =>
      expect((await db.stackEvents.toArray())[0].note).toBe(
        'started after bloodwork',
      ),
    )
  })

  it('keeps the editor open and shows an error when the save fails', async () => {
    const spy = vi
      .spyOn(stackRepo, 'setEventNote')
      .mockRejectedValueOnce(new Error('storage unavailable'))
    const user = userEvent.setup()
    render(<StackChangeNote eventIds={[1]} label="Started Zinc" />)

    await user.click(screen.getByRole('button', { name: 'Add note' }))
    await user.type(screen.getByRole('textbox'), 'after bloodwork')
    await user.click(screen.getByRole('button', { name: 'Save note' }))

    // Failure must NOT look like success: error shown, editor + draft intact,
    // no "Saved" flash.
    expect(await screen.findByRole('alert')).toHaveTextContent(/try again/)
    expect(screen.getByRole('textbox')).toHaveValue('after bloodwork')
    expect(screen.queryByText('Saved')).not.toBeInTheDocument()
    spy.mockRestore()
  })

  it('shows a descriptive before/after average under a stack change', async () => {
    const today = new Date()
    const fiveDaysAgo = toIsoDate(
      new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000),
    )
    const metricId = await addMetric({ name: 'Energy', kind: 'rating' })
    await setMetricEntry(metricId, fiveDaysAgo, 3) // before the change
    await setMetricEntry(metricId, toIsoDate(today), 7) // on/after the change
    await addItem({
      name: 'Zinc',
      kind: 'supplement',
      dose: '25 mg',
      times: ['08:00'],
      groups: [],
    })

    await openGraphsTab()

    expect(
      await screen.findByText(
        'Energy: averaged 3 the 30 days before → 7 after (1 before, 1 after values)',
      ),
    ).toBeInTheDocument()
  })

  it('narrows the before/after window when a smaller window is selected', async () => {
    const today = new Date()
    const tenDaysAgo = toIsoDate(
      new Date(today.getTime() - 10 * 24 * 60 * 60 * 1000),
    )
    const metricId = await addMetric({ name: 'Energy', kind: 'rating' })
    await setMetricEntry(metricId, tenDaysAgo, 3) // inside 30d, outside 7d
    await setMetricEntry(metricId, toIsoDate(today), 7)
    await addItem({
      name: 'Zinc',
      kind: 'supplement',
      dose: '25 mg',
      times: ['08:00'],
      groups: [],
    })

    const user = await openGraphsTab()
    // Default 30-day window includes the value from 10 days ago.
    expect(
      await screen.findByText(/averaged 3 the 30 days before → 7 after/),
    ).toBeInTheDocument()

    // Switching to 7 days drops it → before side now empty.
    await user.selectOptions(
      screen.getByLabelText('Compare Energy averages'),
      '7',
    )
    expect(
      await screen.findByText(
        'Energy: not enough data before → 7 after (1 after values)',
      ),
    ).toBeInTheDocument()
  })

  it('shows the no-values note for a metric without entries', async () => {
    await addMetric({ name: 'Energy', kind: 'rating' })
    await openGraphsTab()

    expect(
      await screen.findByText(/No values logged for Energy/),
    ).toBeInTheDocument()
  })

  it('lists logged health events for the period', async () => {
    const metricId = await addMetric({ name: 'Energy', kind: 'rating' })
    await setMetricEntry(metricId, toIsoDate(new Date()), 7)
    await addHealthEvent(toIsoDate(new Date()), 'Fever', 'symptom')

    await openGraphsTab()

    expect(
      await screen.findByText('Health events in this period'),
    ).toBeInTheDocument()
    expect(screen.getByText('Symptom: Fever')).toBeInTheDocument()
    expect(
      screen.getByRole('region', { name: 'Health events' }),
    ).toBeInTheDocument()
  })
})
