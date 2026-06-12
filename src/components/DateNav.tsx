// src/components/DateNav.tsx — day-by-day navigation for the Today screen:
// previous/next arrows, a native calendar picker, and a shortcut back to
// today. Never navigates into the future. Pure presentation — the parent
// owns the selected date.
import { addDays } from '../lib/dates'

interface DateNavProps {
  date: string // selected local date 'YYYY-MM-DD'
  today: string // current local date — the navigation ceiling
  onChange: (date: string) => void
}

export default function DateNav({ date, today, onChange }: DateNavProps) {
  const isToday = date === today

  return (
    <div className="date-nav">
      <button
        type="button"
        className="date-nav-arrow"
        aria-label="Previous day"
        onClick={() => onChange(addDays(date, -1))}
      >
        ‹
      </button>

      <label className="visually-hidden" htmlFor="date-nav-picker">
        Viewing date
      </label>
      <input
        id="date-nav-picker"
        type="date"
        value={date}
        max={today}
        onChange={(e) => {
          // ignore empty/out-of-range values from manual typing
          if (e.target.value && e.target.value <= today)
            onChange(e.target.value)
        }}
      />

      <button
        type="button"
        className="date-nav-arrow"
        aria-label="Next day"
        disabled={isToday}
        onClick={() => onChange(addDays(date, 1))}
      >
        ›
      </button>

      {!isToday && (
        <button
          type="button"
          className="button-subtle"
          onClick={() => onChange(today)}
        >
          Back to today
        </button>
      )}
    </div>
  )
}
