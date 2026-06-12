// tests/app.test.tsx — smoke tests for the walking skeleton: the app renders
// its shell (header, date, empty Today state) and the date helper formats
// deterministically. Feature behavior gets its own test files as backlog
// items 2+ land.
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import App from '../src/App'
import { formatTodayHeading } from '../src/lib/dates'

afterEach(cleanup)

describe('formatTodayHeading', () => {
  it('formats as "Weekday, Month day" in the given locale', () => {
    // June 11 2026 is a Thursday; explicit locale keeps the test
    // independent of the machine running it
    expect(formatTodayHeading(new Date(2026, 5, 11), 'en-US')).toBe(
      'Thursday, June 11',
    )
  })
})

describe('App walking skeleton', () => {
  it('renders the StackTrack header', () => {
    render(<App />)
    expect(
      screen.getByRole('heading', { name: 'StackTrack' }),
    ).toBeInTheDocument()
  })

  it('shows the empty Today checklist state', () => {
    render(<App />)
    const checklist = screen.getByRole('region', {
      name: "Today's checklist",
    })
    expect(checklist).toHaveTextContent('your stack is empty')
  })
})
