// src/lib/dates.ts — pure date-formatting helpers. No state, no side effects.
// All user-facing date text comes from here so formats stay consistent.

// Formats a date for the Today header, e.g. "Thursday, June 11".
// Defaults to the device's locale on purpose — the app follows the user's
// settings; the parameter exists so tests can pin a locale deterministically.
export function formatTodayHeading(date: Date, locale?: string): string {
  return date.toLocaleDateString(locale, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })
}

// Formats an 'HH:mm' schedule time for display, e.g. '08:00' → '8:00 AM'
// (or '08:00' in 24-hour locales). Locale parameter exists for tests.
export function formatTime(time: string, locale?: string): string {
  const [hours, minutes] = time.split(':').map(Number)
  const date = new Date(2000, 0, 1, hours, minutes)
  return date.toLocaleTimeString(locale, {
    hour: 'numeric',
    minute: '2-digit',
  })
}

// Local calendar date as 'YYYY-MM-DD'. Deliberately NOT toISOString(), which
// uses UTC and would put late-evening events on the wrong day.
export function toIsoDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
