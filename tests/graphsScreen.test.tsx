// tests/graphsScreen.test.tsx — flow tests for the Graphs screen: metric
// selection, the collapsed stack-change legend, and empty states. Chart
// pixel output isn't asserted (jsdom has no layout); the shaping logic is
// covered by graphView.test.ts and the visual result by the demo gate.
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../src/App'
import { db } from '../src/db/db'
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
