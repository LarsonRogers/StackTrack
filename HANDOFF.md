# Handoff — StackTrack
<!-- Overwritten by the agent after every committed task. -->

**As of:** 2026-06-18 · **Pack version:** v12.16 · **Audience mode:** Technical non-dev
**Last completed:** Backlog #23 — **Metric notes**. Added a persistent `note?`
on the Metric definition (mirrors StackItem.note) AND a new per-day `metricNotes`
table (mirrors itemNotes, one per metricId+date) written only through the new
`metricNoteRepository`. Schema bumped v9 → **v10** (additive, empty new table,
no migration). UI: note field in MetricForm, persistent note + per-day note
editor in MetricLogger, TodayScreen passes the day's note down. Carried
metricNotes through export/import/merge/sync. Full suite **168 green** (was 159);
lint/format/typecheck/build pass; independent review **zero blockers**.

**On branch `feature/metric-notes` — committed, NOT merged or pushed.** Awaiting
user demo confirmation (dev server was started at http://localhost:5173/). Merge
to main + push when the user is happy (CI will then run + redeploy).

**Confirmed next task:** Backlog #24 — **Med/supplement frequency** (every N days
+ specific days of week + on/off cycles; Today/any dated view shows an item only
on days it's due). Then #25 — in-app reminders. These three were requested
together (2026-06-18) and confirmed in scope; building one at a time.

**Open watch items:**
- **#24 frequency** will change `lib/todayView`/`buildTimeSections` (currently
  shows EVERY active item every day) — add a pure "is due on date" helper
  (`lib/schedule.ts`) + a `schedule?` field on StackItem. Affects Today + date
  nav. Cross-cutting → confirm a pre-flight plan first.
- **#25 reminders** new table; surface as in-app advisory section; shape the
  rows so OS push (backlog #20) can deliver them later. Overlaps #24's cycle
  concept (keep frequency=due-or-not vs reminder=message separate).
- Deploy still gated on the `security` job (trufflehog + semgrep + production-
  scoped `npm audit`); dependabot tracks dev-tooling updates non-blocking.
- Pre-existing: items 12 (cross-device merge) + 13e (two-device sync) demo gates
  open; backlog FUTURE 20 (push/dose reminders) + 21 (Apple Health) + 22
  (chunk first sync push) still planned.
- Live app: https://stacktrack-ea9.pages.dev · Sync server: /health → ok.

**Resume prompt (paste into any agent):**
    Read AGENTS.md, then HANDOFF.md, then the last entries of
    DECISION_LOG.md as needed. Run the Session Resumption Protocol and
    report status before proceeding.
