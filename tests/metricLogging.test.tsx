// tests/metricLogging.test.tsx — UI flow tests: defining a metric on the
// Metrics tab and logging values from the Today screen. Persistence rules
// are covered by metricRepository.test.ts.
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../src/App'
import { db } from '../src/db/db'
import { addMetric } from '../src/db/metricRepository'

beforeEach(async () => {
  await db.items.clear()
  await db.stackEvents.clear()
  await db.intakes.clear()
  await db.itemNotes.clear()
  await db.metrics.clear()
  await db.metricEntries.clear()
})

afterEach(cleanup)

describe('Metrics tab', () => {
  it('defines a new rating metric via the form', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: 'Metrics' }))
    await user.click(
      await screen.findByRole('button', { name: '+ Add metric' }),
    )
    await user.type(screen.getByLabelText('Name'), 'Energy')
    await user.click(screen.getByRole('button', { name: 'Add metric' }))

    expect(await screen.findByText('Energy')).toBeInTheDocument()
    expect(screen.getByText('1–10 rating')).toBeInTheDocument()
  })

  it('defines a composite metric with named parts', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: 'Metrics' }))
    await user.click(
      await screen.findByRole('button', { name: '+ Add metric' }),
    )
    await user.type(screen.getByLabelText('Name'), 'Blood Pressure')
    await user.click(screen.getByRole('radio', { name: 'Multiple numbers' }))
    await user.type(screen.getByLabelText('Part 1 name'), 'Systolic')
    await user.type(screen.getByLabelText('Part 2 name'), 'Diastolic')
    await user.click(screen.getByRole('button', { name: 'Add metric' }))

    expect(await screen.findByText('Blood Pressure')).toBeInTheDocument()
    expect(
      screen.getByText('multiple numbers (Systolic / Diastolic)'),
    ).toBeInTheDocument()
    const metric = (await db.metrics.toArray())[0]
    expect(metric.components).toEqual([
      { name: 'Systolic', unit: undefined },
      { name: 'Diastolic', unit: undefined },
    ])
  })
})

describe('Today screen metric logging', () => {
  it('logs a rating with one tap and shows it selected', async () => {
    await addMetric({ name: 'Energy', kind: 'rating' })
    const user = userEvent.setup()
    render(<App />)

    const ratingGroup = await screen.findByRole('group', {
      name: 'Energy rating',
    })
    expect(ratingGroup).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '7', pressed: false }))

    expect(
      await screen.findByRole('button', { name: '7', pressed: true }),
    ).toBeInTheDocument()
    const entries = await db.metricEntries.toArray()
    expect(entries).toHaveLength(1)
    expect(entries[0].value).toBe(7)
  })

  it('logs a number metric via the input', async () => {
    await addMetric({ name: 'Weight', kind: 'number', unit: 'kg' })
    const user = userEvent.setup()
    render(<App />)

    await user.type(await screen.findByLabelText('Weight value'), '83.6')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(await screen.findByText('✓ 83.6')).toBeInTheDocument()
  })

  it('logs a composite metric and shows the joined value', async () => {
    await addMetric({
      name: 'Blood Pressure',
      kind: 'composite',
      components: [
        { name: 'Systolic', unit: 'mmHg' },
        { name: 'Diastolic', unit: 'mmHg' },
      ],
    })
    const user = userEvent.setup()
    render(<App />)

    await user.type(await screen.findByLabelText('Systolic (mmHg)'), '120')
    await user.type(screen.getByLabelText('Diastolic (mmHg)'), '80')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(await screen.findByText('✓ 120/80')).toBeInTheDocument()
    expect((await db.metricEntries.toArray())[0].values).toEqual([120, 80])
  })
})
