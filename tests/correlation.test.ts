// tests/correlation.test.ts — pure descriptive-correlation math (#29):
// before/after windowing around a change date, average + count per side, and
// the strictly-descriptive caption (rating/number/boolean/composite, empty
// sides). Deterministic — all dates are passed in, no Date mocking.
import { describe, expect, it } from 'vitest'
import {
  CHANGE_WINDOW_OPTIONS,
  DEFAULT_CHANGE_WINDOW,
  describeChange,
  summarizeChange,
  type DatedValue,
} from '../src/lib/correlation'

const v = (date: string, value: number): DatedValue => ({ date, value })

describe('summarizeChange — windowing', () => {
  it('splits values into the before and after windows by date', () => {
    const values = [
      v('2026-05-20', 4), // before
      v('2026-05-25', 6), // before
      v('2026-06-01', 8), // change date → after
      v('2026-06-10', 10), // after
    ]
    const s = summarizeChange(values, '2026-06-01', 30)
    expect(s.before).toEqual({ count: 2, avg: 5 })
    expect(s.after).toEqual({ count: 2, avg: 9 })
    expect(s.windowDays).toBe(30)
  })

  it('treats the change date itself as the first AFTER day, not before', () => {
    const s = summarizeChange([v('2026-06-01', 7)], '2026-06-01', 30)
    expect(s.before).toEqual({ count: 0, avg: null })
    expect(s.after).toEqual({ count: 1, avg: 7 })
  })

  it('includes the exact window boundaries and excludes just outside them', () => {
    // window 10 → before = [05-22 .. 05-31], after = [06-01 .. 06-10]
    const values = [
      v('2026-05-21', 1), // 1 day too early → excluded
      v('2026-05-22', 2), // before-start boundary → included
      v('2026-05-31', 3), // day before change → included
      v('2026-06-10', 4), // after-end boundary → included
      v('2026-06-11', 5), // 1 day too late → excluded
    ]
    const s = summarizeChange(values, '2026-06-01', 10)
    expect(s.before).toEqual({ count: 2, avg: 2.5 }) // 2,3
    expect(s.after).toEqual({ count: 1, avg: 4 }) // 4
  })

  it('reports an empty side as count 0 / avg null (never 0 or NaN)', () => {
    const s = summarizeChange([v('2026-06-05', 9)], '2026-06-01', 30)
    expect(s.before).toEqual({ count: 0, avg: null })
    expect(s.after.avg).toBe(9)
  })

  it('exposes sensible window presets', () => {
    expect(CHANGE_WINDOW_OPTIONS).toContain(DEFAULT_CHANGE_WINDOW)
    expect([...CHANGE_WINDOW_OPTIONS]).toEqual([7, 14, 30, 90])
  })
})

describe('describeChange — captions', () => {
  const both = summarizeChange(
    [v('2026-05-25', 4), v('2026-06-10', 6)],
    '2026-06-01',
    30,
  )

  it('describes a rating metric with both sides present', () => {
    const text = describeChange(both, { name: 'Energy', kind: 'rating' })
    expect(text).toBe(
      'Energy: averaged 4 the 30 days before → 6 after (1 before, 1 after values)',
    )
  })

  it('rounds to one decimal and strips a trailing .0', () => {
    const s = summarizeChange(
      [v('2026-05-25', 4), v('2026-05-26', 5), v('2026-06-10', 6)],
      '2026-06-01',
      30,
    )
    // before avg = 4.5 (kept), after avg = 6.0 (stripped to "6")
    const text = describeChange(s, { name: 'Energy', kind: 'rating' })
    expect(text).toContain('averaged 4.5 the 30 days before → 6 after')
  })

  it('appends the unit for number metrics', () => {
    const s = summarizeChange(
      [v('2026-05-25', 182), v('2026-06-10', 180.4)],
      '2026-06-01',
      30,
    )
    const text = describeChange(s, {
      name: 'Weight',
      kind: 'number',
      unit: 'kg',
    })
    expect(text).toBe(
      'Weight: averaged 182 kg the 30 days before → 180.4 kg after (1 before, 1 after values)',
    )
  })

  it('expresses a boolean metric as % Yes over logged days', () => {
    const s = summarizeChange(
      [
        v('2026-05-20', 1),
        v('2026-05-22', 0),
        v('2026-06-05', 1),
        v('2026-06-06', 1),
      ],
      '2026-06-01',
      30,
    )
    const text = describeChange(s, { name: 'Slept well', kind: 'boolean' })
    expect(text).toBe(
      'Slept well: averaged 50% Yes the 30 days before → 100% Yes after (2 before, 2 after days)',
    )
  })

  it('labels an empty BEFORE side without inventing a number', () => {
    const s = summarizeChange([v('2026-06-10', 6)], '2026-06-01', 30)
    const text = describeChange(s, { name: 'Energy', kind: 'rating' })
    expect(text).toBe(
      'Energy: not enough data before → 6 after (1 after values)',
    )
  })

  it('labels an empty AFTER side without inventing a number', () => {
    const s = summarizeChange([v('2026-05-25', 4)], '2026-06-01', 30)
    const text = describeChange(s, { name: 'Energy', kind: 'rating' })
    expect(text).toBe(
      'Energy: averaged 4 the 30 days before → not enough data after (1 before values)',
    )
  })

  it('returns null when neither side has data', () => {
    const s = summarizeChange([], '2026-06-01', 30)
    expect(describeChange(s, { name: 'Energy', kind: 'rating' })).toBeNull()
  })

  it('returns null for composite metrics (not summarizable in v1)', () => {
    expect(
      describeChange(both, { name: 'Blood Pressure', kind: 'composite' }),
    ).toBeNull()
  })

  it('stays strictly descriptive — no causal or advisory wording', () => {
    const text = describeChange(both, { name: 'Energy', kind: 'rating' }) ?? ''
    expect(text).not.toMatch(
      /because|caused|due to|should|recommend|try|improve|better|worse/i,
    )
  })
})
