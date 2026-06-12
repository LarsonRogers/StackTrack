# Decision Log — StackTrack
<!-- APPEND-ONLY. Oldest first, newest at the bottom. One entry per committed
     task. Format: protocols/log-format.md -->

## [2026-06-11] Project definition & setup — Claude Code
- Did: Ran First Session Protocol (type B, idea-stage → product-definition
  protocol). Filled AGENTS.md Part 2 (summary, audience mode, stack,
  validation commands, file structure). Created BACKLOG.md (7 items),
  DECISION_LOG.md, HANDOFF.md. No app code written yet.
- Decisions:
  - Audience mode: Technical non-dev — WHY: user self-identified as
    "somewhat technical" in audience detection.
  - Pack version: v12.0.
  - Product brief confirmed (with one amendment): med/supplement stack
    tracker with groups, schedule times, daily checklist, ≤10 custom daily
    metrics (per-metric choice of 1–10 rating or free number), daily notes,
    metric graphs. Amendment: record the date of every stack change
    (add/edit/remove) and render color-coded markers at those dates on
    metric graphs — WHY: correlating metric trends with stack changes is
    the core value of the app.
  - Stack: React 18 + TypeScript + Vite, PWA via vite-plugin-pwa, IndexedDB
    via Dexie, Recharts, ESLint/Prettier, Vitest + RTL — WHY: fewest moving
    parts, local-first (private health data stays on device, no paid
    services), mature tooling, installable per user's end goal; data layer
    isolated so sync/accounts can be added later ("eventually public").
  - Out of MVP: push reminders, accounts/sync, export/import (item 7 is the
    first follow-up), dosage/interaction advice (permanently out of scope).
- State: Pack files + project definition only; no source code, no
  package.json. Validation commands written but not live until backlog
  item 1.
- Watch: Local-first = data lost if browser storage cleared before export
  (backlog item 7) lands — keep item 7 early. Reminders/notifications are
  the expected first post-MVP request.

## [2026-06-11] Detach from starter-pack repo; fresh git history — Claude Code
- Did: Folder had been copied from the AI_Agent_Starter_Pack repo with its
  .git intact (origin → github.com/LarsonRogers/AI_Agent_Starter_Pack.git,
  branches main/revised) — push risk to the pack repo. Renamed `.git` →
  `.git_starter_pack_backup/` (kept locally, gitignored, safe to delete —
  pack history also exists on GitHub and in the user's original folder).
  Ran `git init -b main`; initial commit 298c600 contains all 41 files
  including the project-definition work from the prior commit.
- Decisions: Back up inherited .git instead of deleting — WHY: safe-deletion
  protocol; it held one commit unique to this copy (content fully preserved
  in the initial commit). New default branch is `main` — WHY: pack git
  workflow; old `revised` branch was pack-development context.
- State: Standalone repo, no remotes. Inherited pack files (.github CI
  template, .claude/.codex/opencode enforcement configs) retained.
- Watch: `.git_starter_pack_backup/` can be deleted once the user confirms
  it is not needed. `pack-dev/` is starter-pack development history,
  unrelated to the app — candidate for deletion, needs user confirmation.

## [2026-06-11] Cleanup + Backlog item 1: walking skeleton — Claude Code
- Did: Deleted `pack-dev/` and `.git_starter_pack_backup/` (user confirmed
  both; resolves prior watch items). Scaffolded Vite 8 + React 19 +
  TypeScript 6 (strict) app at repo root: `src/App.tsx`,
  `src/screens/TodayScreen.tsx` (empty Today view), `src/lib/dates.ts`
  (pure date helpers), `src/index.css`. PWA via vite-plugin-pwa
  (`vite.config.ts` — manifest, autoUpdate service worker);
  `scripts/generate-icons.mjs` generates `public/pwa-192/512.png`
  dependency-free; `public/favicon.svg`. Tests: Vitest + RTL + jsdom
  (`tests/app.test.tsx`, 3 tests; `tests/setup.ts` registers jest-dom).
  Prettier (semi:false, singleQuote — matches Vite template idiom;
  `.prettierignore` excludes pack docs/configs). Scripts added: typecheck,
  test, format, format:check. Created RUNBOOK.md. Updated AGENTS.md Part 2
  validation commands to the live npm scripts.
- Decisions: Dexie/Recharts NOT installed yet — WHY: skeleton scope; each
  arrives with its backlog item. Tests included in tsconfig.app.json — WHY:
  `tsc -b` typechecks tests too. Icons hand-generated PNG — WHY: no image
  tooling dependency for two static assets.
- State: `npm run dev` serves the app (verified: HTML + manifest 200);
  lint/typecheck/3 tests/format:check/build all pass. PWA precaches 8
  entries. No data model or storage yet.
- Watch: DoD demo gate OPEN — full demo required (backlog item); user has
  not yet confirmed seeing it run. `.github/workflows/agent-ci.yml` still
  has failing placeholder jobs — wiring it to the npm scripts is a CI
  change needing user confirmation (no remote yet, so nothing runs it).
  Root README.md still describes the starter pack, not StackTrack.

## [2026-06-11] Backlog item 1 demo confirmed — Claude Code
- Did: User confirmed seeing the app run at http://localhost:5173 (FULL
  demo, run-demo protocol). Backlog item 1 marked done. Resolves the
  "demo gate OPEN" watch item from the previous entry.
- State: Walking skeleton complete and demonstrated. Next: backlog item 2
  (stack management), task brief pending confirmation.

## [2026-06-11] Backlog item 2: stack management — Claude Code
- Did: Data layer: `src/db/db.ts` (Dexie 4.4.3 schema v1 — `items`,
  `stackEvents` with itemName/group snapshots), `src/db/stackRepository.ts`
  (only write path: addItem/updateItem/archiveItem/unarchiveItem, each
  recording its StackEvent in the same transaction; `buildChangeSummary`
  builds human-readable diffs; no-op edits record nothing). `toIsoDate`
  added to `src/lib/dates.ts` (local date, not UTC). UI:
  `src/components/NavBar.tsx` (Today/Stack tabs), `ItemForm.tsx` (add/edit,
  validation, group datalist suggestions), `src/screens/StackScreen.tsx`
  (grouped list via `src/lib/stackView.ts`, archive/restore, archived
  toggle), `App.tsx` view switch. Tests: 11 new (8 repository behavior,
  3 UI flow), 14 total passing. Deps: dexie, dexie-react-hooks; dev:
  fake-indexeddb, @testing-library/user-event.
- Decisions: Events stored per-item with name/group snapshots; group-level
  display is a render-time collapse (item 6) — WHY: per-item is ground
  truth, survives renames/regroups (user confirmed this design 2026-06-11).
  One purpose-group per item; time-of-day grouping comes from schedule
  times, not groups — WHY: avoids redundant "Morning" groups; upgradable
  to tags later. `put` instead of Dexie `update` in updateItem — WHY:
  UpdateSpec typing rejects plain array properties (`times`).
  @testing-library/user-event added beyond the brief's named deps — WHY:
  standard RTL companion needed for form-flow tests; test-only.
- State: Full stack CRUD working with automatic change history. Today
  screen still skeleton (item 3 next). Validations all green.
- Watch: Demo gate OPEN for item 2 — full demo required. Restore
  (unarchive) has no window.confirm — intentional, it's non-destructive.

## [2026-06-11] Backlog item 2 demo confirmed — Claude Code
- Did: User confirmed the full add/edit/archive/persist flow in the browser
  (FULL demo). Backlog item 2 marked done. Resolves the demo-gate watch
  item from the previous entry.
- State: Stack management live. Next: backlog item 3 (Today checklist),
  task brief pending confirmation.

## [2026-06-11] Backlog item 3: Today checklist + per-item daily notes — Claude Code
- Did: Schema v2 (additive) in `src/db/db.ts`: `intakes` (itemId, date,
  time, takenAt) and `itemNotes` (itemId, date, text), both with
  [itemId+date] compound index. New write paths:
  `src/db/intakeRepository.ts` (markTaken/unmarkTaken — idempotent, slot-
  scoped) and `src/db/itemNoteRepository.ts` (setItemNote — one per
  item+date, empty text clears). `src/lib/todayView.ts` (buildTimeSections:
  items → chronological time sections, item appears once per scheduled
  time). `src/lib/dates.ts` + formatTime (locale-aware 'HH:mm' display).
  Rewrote `src/screens/TodayScreen.tsx`: checklist with checkbox rows,
  progress line, all-done state, inline per-item note editor (note shows on
  all rows of the item; editor opens on the tapped row). Updated 2 skeleton
  tests in `tests/app.test.tsx` (async render + new empty-state text).
  10 new tests (7 repository, 3 UI flow), 24 total.
- Decisions: Per-item daily note added to this task by user amendment
  (2026-06-11) — distinct from the day-level journal note (item 5).
  Marking intake records NO StackEvent — WHY: taking a pill is not a stack
  change; graph markers must reflect stack changes only (recorded as a key
  invariant in Part 2). Notes stored per (itemId, date), not per time slot
  — WHY: "ran out of pills" describes the item's day, not one slot.
- State: Daily check-in works end-to-end (mark/unmark, progress, notes,
  per-day scoping). Items 4 (metrics) next.
- Watch: Demo gate OPEN for item 3 — full demo required.

## [2026-06-11] Backlog item 3 demo confirmed; sorting queued — Claude Code
- Did: User confirmed the daily check-in flow (FULL demo). Item 3 marked
  done. Added backlog item 8 at user request: user-selectable sorting for
  stack views.
- State: Next: backlog item 4 (custom metrics), task brief pending
  confirmation.

## [2026-06-11] Backlog item 4: custom metrics — Claude Code
- Did: Schema v3 (additive) in `src/db/db.ts`: `metrics` (name, kind
  rating|number, unit?, status) and `metricEntries` (metricId, date, value;
  [metricId+date] index). `src/db/metricRepository.ts` (add/update/archive/
  unarchive; MAX_ACTIVE_METRICS=10 enforced in-transaction; kind immutable
  after creation). `src/db/metricEntryRepository.ts` (setMetricEntry upsert
  — one per metric+date, validates rating 1–10 integer at the boundary;
  clearMetricEntry). UI: `src/screens/MetricsScreen.tsx` + `src/components/
  MetricForm.tsx` (definitions tab; kind radios disabled in edit mode; cap
  messaging), `src/components/MetricLogger.tsx` (Today rows: 1–10 tap
  buttons with tap-again-to-clear; number input with save/clear-on-empty),
  Today screen "Daily metrics" section, third NavBar tab, App routed via a
  Record lookup. 12 new tests (9 repository, 3 UI), 36 total.
- Decisions: Metric kind immutable after creation — WHY: switching
  rating↔number corrupts the meaning of logged history (recorded as Part 2
  invariant). Logging values records NO StackEvent — same reasoning as
  intakes. Metric logging lives on Today screen, definitions on their own
  tab — WHY: the daily check-in stays one stop.
- State: Define-and-log loop complete; values per local day, replace on
  re-log. Items 5 (daily journal note) and 6 (graphs) remain.
- Watch: Demo gate OPEN for item 4 — full demo required.

## [2026-06-11] Remove 10-metric cap; item 4 closed — Claude Code
- Did: Removed MAX_ACTIVE_METRICS and all cap enforcement/UI per user
  instruction ("user should not be limited to 10 metrics"):
  `metricRepository.ts` (no cap check on add/unarchive),
  `MetricsScreen.tsx` (no cap messaging; subtitle now "Tracking N metrics"),
  cap test removed (35 tests passing). Updated AGENTS.md Part 2 summary,
  BACKLOG item 4 wording, db.ts comment.
- Decisions: Item 4 demo gate closed on the user's "continue to item 5"
  instruction — treated as user-initiated acceptance; the cap-removal
  change itself is visible in the next demo.
- State: Metrics unlimited. Next: backlog item 5 (daily journal note),
  task brief pending confirmation.

## [2026-06-11] Backlog item 5: daily journal note — Claude Code
- Did: Schema v4 (additive) in `src/db/db.ts`: `dayNotes` (date, text).
  `src/db/dayNoteRepository.ts` (setDayNote — one per date, replace on
  re-save, empty clears). `src/components/JournalSection.tsx` (textarea +
  save with "Saved" flash, draft state separate from saved state), appended
  to TodayScreen below metrics. 4 new tests (3 repository, 1 flow), 39
  total.
- Decisions: JournalSection maps "no row" to null in useLiveQuery
  (`?? null`) — WHY: first() returns undefined for both "loading" and
  "absent"; without the sentinel the section never rendered on an empty
  day (caught by the flow test before commit).
- State: Full daily check-in now: checklist + per-item notes + metrics +
  journal. Item 6 (graphs with stack-change markers) is next.
- Watch: Demo gate OPEN for item 5 — full demo required.
