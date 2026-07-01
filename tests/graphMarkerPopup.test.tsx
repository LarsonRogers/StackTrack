// tests/graphMarkerPopup.test.tsx — the detail card shown when a marker on the
// Graphs chart is tapped. The clickable handles live inside Recharts, whose
// pixel layout jsdom can't produce (see graphsScreen.test.tsx), so the handle
// wiring is demo-verified; here we cover the popup's content and its three
// dismissal paths (close button, Esc, backdrop tap).
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import GraphMarkerPopup, {
  type MarkerPopupData,
} from '../src/components/GraphMarkerPopup'

afterEach(cleanup)

const stackChange: MarkerPopupData = {
  color: '#16a34a',
  dateLabel: 'Jun 11',
  typeLabel: 'Added to stack',
  title: 'Started Vitamin D',
  note: 'after low bloodwork',
}

describe('GraphMarkerPopup', () => {
  it('shows the marker caption, date, title, and why-note', () => {
    render(<GraphMarkerPopup data={stackChange} x={100} onClose={() => {}} />)

    expect(screen.getByText('Added to stack')).toBeInTheDocument()
    expect(screen.getByText('Jun 11')).toBeInTheDocument()
    expect(screen.getByText('Started Vitamin D')).toBeInTheDocument()
    expect(screen.getByText('after low bloodwork')).toBeInTheDocument()
    // Labelled for assistive tech by type + title.
    expect(
      screen.getByRole('dialog', { name: 'Added to stack: Started Vitamin D' }),
    ).toBeInTheDocument()
  })

  it('omits the note paragraph when the marker has no note', () => {
    const noNote: MarkerPopupData = {
      color: '#2563eb',
      dateLabel: 'Jul 1',
      typeLabel: 'Appointment',
      title: 'GI Doc',
    }
    render(<GraphMarkerPopup data={noNote} x={40} onClose={() => {}} />)

    expect(screen.getByText('GI Doc')).toBeInTheDocument()
    expect(screen.queryByText('after low bloodwork')).not.toBeInTheDocument()
  })

  it('closes via the close button', async () => {
    const onClose = vi.fn()
    const user = userEvent.setup()
    render(<GraphMarkerPopup data={stackChange} x={100} onClose={onClose} />)

    await user.click(screen.getByRole('button', { name: 'Close' }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('closes when Escape is pressed', async () => {
    const onClose = vi.fn()
    const user = userEvent.setup()
    render(<GraphMarkerPopup data={stackChange} x={100} onClose={onClose} />)

    await user.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('closes when the backdrop outside the card is tapped', async () => {
    const onClose = vi.fn()
    const user = userEvent.setup()
    const { container } = render(
      <GraphMarkerPopup data={stackChange} x={100} onClose={onClose} />,
    )

    const backdrop = container.querySelector('.graph-marker-backdrop')
    expect(backdrop).not.toBeNull()
    await user.click(backdrop!)
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
