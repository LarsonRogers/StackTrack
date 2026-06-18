# Handoff — StackTrack
<!-- Overwritten by the agent after every committed task. -->

**As of:** 2026-06-18 · **Pack version:** v12.16 · **Audience mode:** Technical non-dev
**Last completed:** Backlog #24 — **Med/supplement frequency**. Items can recur
on a cadence instead of only every day. Optional `schedule?` on StackItem
(**absent = every day**, no schema migration / no version bump — non-indexed,
rides export/import/merge/sync as a plain field). Three kinds:
`everyNDays{n≥2,startDate}`, `daysOfWeek{0–6}`, `cycle{onWeeks,offWeeks,startDate}`.
New pure `lib/schedule.ts` (`isDueOn`/`describeSchedule`); `buildTimeSections`
now filters by date; a frequency change records a StackEvent (graph marker).
Frequency UI in ItemForm, cadence label on the Stack card. Review nit fixed
(CSV now JSON-serializes the schedule object). **183 tests green** (was 168);
lint/format/typecheck/build pass; independent review **zero blockers**.

**Branch `feature/item-frequency` — committed, NOT merged or pushed.** Awaiting
user demo confirmation (dev server live at http://localhost:5173/). Merge to
main + push when happy (CI runs + redeploys then).

**#23 (metric notes) is already merged to main + pushed (06a330d).** #24 branched
off that.

**Confirmed next task:** Backlog #25 — **In-app reminders** (last of the three
requested 2026-06-18). Cycling advisories tied to an item + recurring reminders
+ one-off dated reminders; surfaced as an in-app advisory section when you open
the app; shape the data model so OS push (backlog #20) can deliver the same rows
later. NO push backend in this work. Overlaps #24's cycle concept — keep them
separate: #24 = is-the-item-due, #25 = the message. Cross-cutting → confirm a
pre-flight plan first. New `reminders` table (schema bump expected here, unlike
#24).

**Open watch items:**
- Deploy gated on the `security` job (trufflehog + semgrep + production-scoped
  `npm audit`); dependabot tracks dev-tooling updates non-blocking.
- Windows line-ending note: `autocrlf=true` + `* text=auto` means a branch
  checkout re-materializes files as CRLF and `prettier --check` then fails
  locally even though committed blobs are LF and CI (Linux) passes. Fix if it
  recurs: `npx prettier --write .` before committing — produces no content diff.
- Pre-existing: items 12 (cross-device merge) + 13e (two-device sync) demo gates
  open; backlog FUTURE 20 (push/dose reminders) + 21 (Apple Health) + 22
  (chunk first sync push) still planned.
- Live app: https://stacktrack-ea9.pages.dev · Sync server: /health → ok.

**Resume prompt (paste into any agent):**
    Read AGENTS.md, then HANDOFF.md, then the last entries of
    DECISION_LOG.md as needed. Run the Session Resumption Protocol and
    report status before proceeding.
