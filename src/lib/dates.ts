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
