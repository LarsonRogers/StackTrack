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

## [2026-06-11] Backlog item 5 demo confirmed; date navigation queued — Claude Code
- Did: User confirmed the journal flow (FULL demo). Item 5 marked done.
  Added backlog item 9 at user request: calendar date navigation to
  view/edit past days' entries.
- State: Next: backlog item 6 (metric graphs with stack-change markers),
  task brief pending confirmation.

## [2026-06-11] Backlog item 6: metric graphs with stack-change markers — Claude Code
- Did: Installed recharts 3.8.1 (approved with original stack).
  `src/lib/graphView.ts`: rangeStartDate (30d/90d/all), buildSeries
  (filter+sort to SeriesPoints with local-noon timestamps), collapseEvents
  (same-day+same-type+same-group merge → "Started <group> (N items)";
  ungrouped/solo events keep per-item labels: Started/Stopped <item>,
  "<item>: <summary>" for changes), EVENT_COLORS (added green #16a34a,
  changed amber #d97706, removed red #dc2626).
  `src/screens/GraphsScreen.tsx`: metric selector (archived included,
  labeled), range buttons, Recharts LineChart on a numeric time axis
  (markers render on dates with no logged value), ReferenceLine per marker,
  rating metrics fixed 1–10 Y domain, legend list of changes below the
  chart. 4th NavBar tab + App route. 11 new tests (8 pure helpers, 3
  screen flow), 50 total.
- Decisions: Numeric time axis instead of category axis — WHY: Recharts
  ReferenceLines must land on dates that have no data point. Chart pixel
  output not asserted in jsdom (no layout) — pure helpers carry the logic
  coverage; visual correctness is the demo gate's job.
- State: Core payoff feature complete. Bundle now ~650 KB precache
  (recharts); code-splitting is a future nicety, not a problem at this
  scale. Items 7 (export), 8 (sorting), 9 (date navigation) remain.
- Watch: Demo gate OPEN for item 6 — full demo required.

## [2026-06-11] Backlog item 6 demo confirmed — Claude Code
- Did: User confirmed the graph, markers, and collapsed change legend
  (FULL demo). Item 6 marked done.
- State: Next: backlog item 7 (data export), task brief pending
  confirmation.

## [2026-06-11] Backlog item 7: data export (JSON + CSV) — Claude Code
- Did: `src/lib/exportData.ts`: buildExportBundle (all 7 tables +
  exportedAt + schemaVersion), buildExportCsv (one labeled section per
  table, RFC-4180 quoting, arrays joined "; "), toCsvValue,
  exportAsJson/exportAsCsv download triggers (Blob + anchor). "Backup"
  section at the bottom of StackScreen with both buttons and a plain-text
  note that data lives on-device. 4 new tests (bundle completeness, CSV
  quoting/arrays/sections), 54 total.
- Decisions: CSV format added by user amendment (2026-06-11). JSON is
  canonical for a future import/restore; CSV is human/spreadsheet-facing
  only — WHY: one multi-section CSV is readable in Sheets/Excel but not
  round-trippable. Export buttons live on the Stack screen — WHY: no
  settings screen yet; revisit when one exists. Import/restore NOT queued
  (user did not answer the offer) — re-offer when relevant.
- State: Backup safety net closed — resolves the local-first watch item
  open since project definition. Items 8 (sorting) + 9 (date navigation)
  remain.
- Watch: Demo gate OPEN for item 7 — full demo required.

## [2026-06-12] Item 7 closed; import/restore queued and prioritized — Claude Code
- Did: Item 7 closed on the user's "continue" (user-initiated acceptance,
  as with item 4). Added backlog item 10 (import/restore) at user request,
  ordered ahead of items 8–9 per "before we continue, we also need to be
  able to import data". Resolves the import watch item.
- State: Next: item 10 (import/restore), task brief pending confirmation.

## [2026-06-12] Backlog item 10: import/restore — Claude Code
- Did: `src/lib/importData.ts`: parseBundle (validation only, touches
  nothing — rejects non-JSON / non-StackTrack / newer-schema / damaged
  tables with plain-English messages; tables missing from older exports
  default empty) and applyBundle (clear + bulkAdd all 7 tables in ONE
  transaction; row ids preserved so itemId/metricId references survive;
  any failure aborts the whole transaction). StackScreen Backup section:
  "Import backup" button + hidden JSON file input → confirm dialog with
  backup-vs-current counts → exportAsJson() safety snapshot → applyBundle
  → status message. 8 new tests written BEFORE the UI (validation
  rejections, full round-trip, replace-not-merge, mid-import failure
  leaves data untouched), 62 total.
- Decisions: Restore = replace, never merge — WHY: merging two histories
  is ambiguous (per brief, user confirmed). Safety snapshot downloads
  automatically before every restore — WHY: makes the one destructive
  action in the app user-reversible.
- State: Full backup/restore loop complete. Items 8 (sorting) and 9
  (date navigation) remain.
- Watch: Demo gate OPEN for item 10 — full demo required.

## [2026-06-12] Backlog item 10 demo confirmed — Claude Code
- Did: User confirmed the full export→import round-trip worked ("worked
  perfectly"). Item 10 marked done.
- State: Next: backlog item 8 (stack view sorting), task brief pending
  confirmation. Item 9 (date navigation) after.

## [2026-06-12] Backlog item 8: stack view sorting — Claude Code
- Did: `src/lib/stackView.ts`: StackSortMode (group|name|time|recent),
  SORT_MODE_LABELS, sortByName, sortByEarliestTime (times[0] is earliest —
  times stored sorted), latestEventDates + sortByRecentlyChanged (reads
  stackEvents history). StackScreen: "Sort by" select (shown when 2+
  items), group mode keeps sections, other modes render a flat list with
  the group inline in the detail line; choice persisted to localStorage
  key `stacktrack.stackSortMode` (UI preference, deliberately not in the
  db or exports). Active-item row extracted to one renderActiveItem
  helper (was duplicated). 5 new tests (4 helper units in new
  tests/stackView.test.ts, 1 flow incl. persistence), 67 total.
- Decisions: localStorage over db for sort preference — WHY: not health
  data; keeps exports clean. "Recently changed" derives from stackEvents
  (day-granular; same-day ties break by name) — WHY: the history table is
  already the authoritative record of change.
- State: Item 9 (date navigation) is the last remaining backlog item.
- Watch: Demo gate OPEN for item 8 — full demo required.

## [2026-06-12] Backlog item 8 demo confirmed — Claude Code
- Did: User confirmed all four sort modes and persistence (FULL demo).
  Item 8 marked done.
- State: Item 9 (date navigation) is the final backlog item; task brief
  pending confirmation.

## [2026-06-12] Backlog item 9: date navigation — Claude Code
- Did: `src/lib/dates.ts`: parseIsoDate (local noon), addDays.
  `src/components/DateNav.tsx`: prev/next arrows (next disabled at today;
  future blocked at the input via max=today too), native date picker,
  "Back to today" shortcut (renamed from "Today" — collided with the
  NavBar tab name in role queries and was ambiguous for users too).
  TodayScreen: selectedDate state drives ALL day-scoped queries and writes
  (checklist, item notes, metrics, journal); items query widened to all
  items so archived names can label history; "Also recorded this day"
  section surfaces intakes with no current-schedule row; MetricLogger and
  JournalSection keyed by date so per-day drafts can't leak across days;
  note editor closes on navigation. 3 new tests (future blocked, past-day
  write doesn't touch today, orphaned records visible), 70 total.
- Decisions: Past-day checklist rows derive from the CURRENT schedule —
  WHY: stackEvents record that things changed, not full schedule
  snapshots, so historical reconstruction isn't reliably possible;
  limitation stated in the brief and accepted by the user. Recorded
  intakes always display faithfully via the orphan section.
- State: ALL backlog items (1–10) complete pending this demo. MVP feature
  set fully built.
- Watch: Demo gate OPEN for item 9 — full demo required.
