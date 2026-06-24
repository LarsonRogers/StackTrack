# Handoff — StackTrack
<!-- Overwritten by the agent after every committed task. -->

**As of:** 2026-06-24 · **Pack version:** v12.19 · **Audience mode:** Technical non-dev
**Last completed:** Backlog **#28 — Adherence intelligence**. A new **"Adherence"
bottom-bar tab** (3rd, next to Today & Graphs): a read-only, on-device, STRICTLY
DESCRIPTIVE view of how consistently the stack was taken. Shows overall **% taken**
for a 30d/90d/all range (with a covered-period caption like "Jun 1 – Jun 24"), a
**per-item breakdown** (% + bar + current streak), and **"Missed most on"** listing
the specific worst days as full weekday + date ("Saturday, Jun 20"). Header + range
+ overall % are **sticky**; the item list scrolls beneath. All math is in pure,
tested `lib/adherence.ts`. Intakes only — reminder-responsiveness (#25 Task C) was
deferred.

**Key design notes:** a due dose-slot = (active item, due per `isDueOn`, on/after
its add date) × each scheduled time; taken iff a matching IntakeRecord exists.
Streak walks back over DUE days (past incomplete day breaks it; an incomplete
TODAY is skipped as in-progress). Range start clamps to the earliest data, so
30d/90d/all coincide until you have data older than the window — **by design, not
a bug** (the caption makes this visible).

**287 tests green** (+19); lint/typecheck/format/build pass; bundle precache 778
KiB (+5, no new deps). Independent review of the core build **zero blockers**
(acted on 1 IMPORTANT + 2 NITs). Post-demo tweaks (sticky, caption, full-weekday
missed-days) applied per user's explicit "no need to test, commit and push".

**Committed on `feature/adherence-screen`; MERGING to `main` + PUSH** — CI
(lint/tests/security) + Cloudflare Pages auto-deploy run on the push. Confirm CI
green + live app updated; if CI fails, investigate before further work.

**No new dependencies** this task.

**Up next (BACKLOG.md):** #29 descriptive correlation insight (graphs: averages
around stack-change markers — strictly descriptive, pairs with this), #30 consent
framework (gates off-device #31/#32/#33 + therapy #39), #34 attachments, #36
multi-ingredient, #40 auto refill reminder, #37 Today collapsible meds section.
#35 = parked.

**Open watch items:**
- **#28 deferred:** reminder-responsiveness analytics (done-on-first vs after-snooze
  from #25 ReminderEvents) was scoped out of v1 — a natural #28b if wanted.
- **#28 schedule history:** adherence uses each item's CURRENT schedule for
  historical due-days (cadence isn't versioned). If a user changes an item's
  frequency, older days reflect the new cadence. Documented in-app footnote.
- **#28 perf:** AdherenceScreen reads ALL intakes (`db.intakes.toArray()`) and the
  report iterates day-by-day; fine for a single-user local app, but a multi-year
  power user could see slowness — scope the query by date if it ever bites.
- **dnd-kit reorder duplication** (#38b): `reorderTodaySection`/`reorderItems`
  near-identical; left as-is (helper for 2 sites = over-engineering).
- **TruffleHog false-fail:** Dependabot PRs can show a red "Security scan" from the
  `BASE == HEAD` quirk — NOT a finding. Fix = `@dependabot rebase`.
- New DB *table* → extend export/import/merge/sync (4 libs) + fixtures + bump
  export-test schemaVersion. New *fields* on an existing table need none of that.
- Tier-use reporting is ON: note Light-tier (haiku) sub-task use in the work
  summary; silent when none ran. (#28 used Opus for exploration + review.)
- Windows autocrlf: format only the files you touched (`prettier --check
  --end-of-line auto <files>` to find REAL issues amid the CRLF noise).
- A dev server may be running on :5173 — stop it when done (stopped this task).
- Pre-existing: items 12 + 13e sync demo gates open.
- Live app: https://stacktrack-ea9.pages.dev · Sync server: /health → ok.

**Resume prompt (paste into any agent):**
    Read AGENTS.md, then HANDOFF.md, then the last entries of
    DECISION_LOG.md as needed. Run the Session Resumption Protocol and
    report status before proceeding.
