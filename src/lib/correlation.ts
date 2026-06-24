// src/lib/correlation.ts — pure, read-only "descriptive correlation insight"
// (backlog #29). For a stack-change date and one metric's logged entries,
// summarizes the metric's average over a window of days BEFORE the change vs
// the same number of days ON/AFTER it. No state, no db access.
//
// STRICTLY DESCRIPTIVE of logged data: it restates averages of values the user
// logged — nothing more. No inference, no significance testing, no causal or
// advisory language anywhere. The permanent no-advice invariant holds (see
// AGENTS.md Part 2). The window deliberately uses the metric's logged points
// as-is; days without a logged value simply don't count toward either side.
import type { MetricKind } from '../db/db'
import { addDays } from './dates'

// Window presets offered on the Graphs screen (days before/after a change).
// Day-based (not calendar months) so both sides stay the same length and the
// control reads like the existing 30d/90d range buttons. 30 is the default.
export const CHANGE_WINDOW_OPTIONS = [7, 14, 30, 90] as const
export type ChangeWindow = (typeof CHANGE_WINDOW_OPTIONS)[number]
export const DEFAULT_CHANGE_WINDOW: ChangeWindow = 30

// One date+value pair — the minimal shape this lib needs from a MetricEntry,
// so callers can pass entries (or test fixtures) without the full record.
export interface DatedValue {
  date: string // local calendar date 'YYYY-MM-DD'
  value: number
}

// Average + how many logged values it came from, for one side of a change.
// avg is null exactly when count is 0 (no logged values that side).
export interface SideSummary {
  count: number
  avg: number | null
}

export interface ChangeSummary {
  windowDays: number
  before: SideSummary // the `windowDays` days strictly BEFORE the change date
  after: SideSummary // the change date and the next `windowDays - 1` days
}

// Mean of the values whose date falls in [start, end] inclusive (string compare
// is correct for 'YYYY-MM-DD'). count 0 → avg null (never a divide-by-zero or a
// misleading 0).
function sideSummary(
  values: DatedValue[],
  start: string,
  end: string,
): SideSummary {
  const inWindow = values.filter((v) => v.date >= start && v.date <= end)
  if (inWindow.length === 0) return { count: 0, avg: null }
  const sum = inWindow.reduce((acc, v) => acc + v.value, 0)
  return { count: inWindow.length, avg: sum / inWindow.length }
}

// Summarizes one metric's logged values around a single change date. The
// BEFORE window is the `windowDays` days ending the day before the change
// (excludes the change date); the AFTER window is the change date plus the
// following `windowDays - 1` days (includes the change date as day 0). Each
// window is therefore exactly `windowDays` calendar days and they never
// overlap.
export function summarizeChange(
  values: DatedValue[],
  changeDate: string,
  windowDays: number,
): ChangeSummary {
  const beforeStart = addDays(changeDate, -windowDays)
  const beforeEnd = addDays(changeDate, -1)
  const afterStart = changeDate
  const afterEnd = addDays(changeDate, windowDays - 1)
  return {
    windowDays,
    before: sideSummary(values, beforeStart, beforeEnd),
    after: sideSummary(values, afterStart, afterEnd),
  }
}

// Formats an average for display: ratings/numbers to at most one decimal with
// trailing ".0" dropped (6.0 → "6", 4.17 → "4.2", 182 → "182"), with the unit
// appended when present. Boolean averages are a proportion of "Yes" days →
// whole-number percent.
function formatAvg(
  avg: number,
  kind: MetricKind,
  unit: string | undefined,
): string {
  if (kind === 'boolean') return `${Math.round(avg * 100)}% Yes`
  const rounded = String(Number(avg.toFixed(1)))
  return unit ? `${rounded} ${unit}` : rounded
}

export interface DescribeOptions {
  name: string
  kind: MetricKind
  unit?: string
}

// Builds the strictly-descriptive one-line caption for a change row, or null
// when there is nothing to say (both sides have no logged values, or the metric
// kind isn't summarizable — composite). Wording is intentionally flat: it
// reports averages of logged values and labels an empty side "not enough data".
// No causal or advisory phrasing — keep it that way (no-advice invariant).
export function describeChange(
  summary: ChangeSummary,
  opts: DescribeOptions,
): string | null {
  if (opts.kind === 'composite') return null
  const { before, after, windowDays } = summary
  if (before.count === 0 && after.count === 0) return null

  // "values" for numeric/rating metrics, "days" for boolean (each logged day is
  // a yes/no, not a measurement to average in the same sense).
  const noun = opts.kind === 'boolean' ? 'days' : 'values'

  const beforeText =
    before.avg === null
      ? 'not enough data before'
      : `averaged ${formatAvg(before.avg, opts.kind, opts.unit)} the ${windowDays} days before`
  const afterText =
    after.avg === null
      ? 'not enough data after'
      : `${formatAvg(after.avg, opts.kind, opts.unit)} after`

  // Count tail, only for the side(s) that actually have data.
  const counts: string[] = []
  if (before.count > 0) counts.push(`${before.count} before`)
  if (after.count > 0) counts.push(`${after.count} after`)
  const countText = counts.length ? ` (${counts.join(', ')} ${noun})` : ''

  return `${opts.name}: ${beforeText} → ${afterText}${countText}`
}
