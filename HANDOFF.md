# Handoff — StackTrack
<!-- Overwritten by the agent after every committed task. -->

**As of:** 2026-06-24 · **Pack version:** v12.19 · **Audience mode:** Technical non-dev
**Last completed:** Backlog **#29 — Descriptive correlation insight**. On the
**Graphs** screen, each **"Stack changes in this period"** row now shows a
one-line, STRICTLY DESCRIPTIVE before/after average of the **currently-selected
metric** around that change date (e.g. *"Energy: averaged 4.2 the 30 days before
→ 6.1 after (8 before, 11 after values)"*). A **window selector** (7/14/30/90
days, default 30) in that section sets the before/after span and applies to every
row. All math is in pure, tested `lib/correlation.ts`.

**Key design notes:** before = the `windowDays` days ending the day BEFORE the
change; after = the change date + `windowDays−1` days (change date is after-day-0);
each side is exactly `windowDays` days, inclusive, non-overlapping. An empty side
is labeled "not enough data" (never a fake number); both-sides-empty → no line.
Boolean → "% Yes"; number metrics append the unit; **composite metrics are
skipped** (averaging multiple parts into one figure would mislead — by design for
v1). `metricValues` is the metric's FULL entry history (not range-clamped) so the
window can reach outside the visible chart range. No-advice invariant upheld — a
regression test asserts the caption never contains causal/advisory wording.

**303 tests green** (+16); lint/typecheck/format/build pass; bundle precache 780
KiB (+2, no new deps). Independent fresh-context review **APPROVE, zero blockers**
(2 NITs; fixed the comment-accuracy one, left the count-1 plural noun). Demo
confirmed by user.

**Committed on `feature/correlation-insight`; MERGING to `main` + PUSH** — CI
(lint/tests/security) + Cloudflare Pages auto-deploy run on the push. Confirm CI
green + live app updated; if CI fails, investigate before further work.

**No new dependencies** this task.

**Up next (BACKLOG.md):** #30 consent framework (gates off-device #31/#32/#33 +
therapy #39), #37 Today collapsible meds section, #36 multi-ingredient, #40 auto
refill reminder, #34 attachments. #35 = parked.

**Open watch items:**
- **#29 scope:** summary is for the ONE selected metric only and attaches to
  stack-change rows (not health-event rows). Composite metrics intentionally show
  no summary. A natural follow-up could summarize per composite component.
- **#29 windows can overlap adjacent changes:** the before/after windows are
  per-change and independent, so two close changes share days — descriptive by
  design, not deduped.
- **#28 deferred:** reminder-responsiveness analytics (done-on-first vs after-snooze
  from #25 ReminderEvents) — a natural #28b if wanted.
- **#28 schedule history:** adherence uses each item's CURRENT schedule for
  historical due-days (cadence isn't versioned). Documented in-app footnote.
- **#28 perf:** AdherenceScreen reads ALL intakes; fine for single-user local, but
  a multi-year power user could see slowness — scope the query by date if it bites.
- **dnd-kit reorder duplication** (#38b): `reorderTodaySection`/`reorderItems`
  near-identical; left as-is (helper for 2 sites = over-engineering).
- **TruffleHog false-fail:** Dependabot PRs can show a red "Security scan" from the
  `BASE == HEAD` quirk — NOT a finding. Fix = `@dependabot rebase`.
- New DB *table* → extend export/import/merge/sync (4 libs) + fixtures + bump
  export-test schemaVersion. New *fields* on an existing table need none of that.
- Tier-use reporting is ON: note Light-tier (haiku) sub-task use in the work
  summary; silent when none ran. (#29 used Opus for exploration + review.)
- Windows autocrlf: format only the files you touched (`prettier --check
  --end-of-line auto <files>` to find REAL issues amid the CRLF noise).
- A dev server may be running on :5173 — stop it when done (stopped this task).
- Pre-existing: items 12 + 13e sync demo gates open.
- Live app: https://stacktrack-ea9.pages.dev · Sync server: /health → ok.

**Resume prompt (paste into any agent):**
    Read AGENTS.md, then HANDOFF.md, then the last entries of
    DECISION_LOG.md as needed. Run the Session Resumption Protocol and
    report status before proceeding.
