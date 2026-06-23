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

## [2026-06-12] Deployment gate cleared; Cloudflare Pages confirmed — Claude Code
- Did: User asked how to install the app on their phone (deployment
  protocol triggered, opt-in). Ran Step 0 data-sensitivity gate BEFORE any
  deploy step.
- Decisions:
  - Gate Signal 1 (user declaration): "Currently it will only be my own
    [data], but I may share it with others. My hope was that they would
    only see their own data, hosted on their own device, no access to my
    own." Signal 2 (agent assessment): FLAGGED — health data (medications,
    doses, schedules, metrics, notes in IndexedDB). → HALT per protocol.
  - HALT statement presented with the local-first clarification: only app
    CODE is hosted; health data never leaves the user's devices; anyone
    with the URL loads an empty copy; Cloudflare sees standard request
    logs; app contains no analytics/telemetry. User explicitly signed off
    on all three points ("Confirmed — acceptable").
  - Sharing model confirmed to user: each device = isolated data store;
    no cross-user access possible without a future backend (separate
    phase + gate if ever wanted).
  - Target: Cloudflare Pages via direct upload (`wrangler pages deploy`)
    — WHY: free, static, no server admin, easy deletion, and requires NO
    git remote (avoids the separately-gated remote-creation step). User's
    hosting choice doubles as the external-service confirmation
    (default-policy item).
- State: Gate recorded; deploy not yet executed. Next: user creates
  Cloudflare account + wrangler login, then agent builds and deploys.
- Watch: Item 9 demo gate still open (phone install will demonstrate date
  navigation alongside the live-URL demo).

## [2026-06-12] Deployed to Cloudflare Pages — Claude Code
- Did: User created Cloudflare account, verified email, ran `npx wrangler
  login` themselves (credentials never touched the agent). Pre-deploy:
  clean tree, lint green, 70/70 tests, fresh `npm run build`. Created
  Pages project `stacktrack` (production branch main) and deployed `dist/`
  of commit 8a48f34 via `npx wrangler pages deploy dist
  --project-name=stacktrack --branch main`. Live at
  https://stacktrack-ea9.pages.dev — verified: app HTML, PWA manifest,
  and sw.js all return 200 over HTTPS. RUNBOOK.md gained "Deployed
  version", "Install on a phone", and "Take it down" sections (teardown:
  `npx wrangler pages project delete stacktrack` + URL-must-404
  verification step).
- Decisions: Direct upload, no git remote — per gate entry above. First
  attempt failed with Cloudflare error 8000077 (email unverified); user
  verified and retry succeeded — no code/config cause.
- State: App publicly served (code only). Demo gate for the live URL +
  phone install OPEN — user must confirm seeing it run on the phone.
- Watch: wrangler is invoked via npx (not a package.json dependency) —
  fine for occasional deploys; add as devDependency + `deploy` script if
  deploys become routine (needs confirmation).

## [2026-06-12] MVP complete — all demo gates closed; items 11+12 queued — Claude Code
- Did: User confirmed the live deployment and phone install ("Looks good!
  MVP is complete") — closes the deployment demo gate AND item 9's gate.
  All backlog items 1–10 done. Queued item 11 (GitHub remote + CI +
  auto-publish to the existing Pages project, per user request) and item
  12 (device sync, approach to be decided — user asked for a security
  assessment of cloud-drive sync vs. alternatives).
- State: MVP shipped and installed. Next: item 11 brief presented;
  item 12 needs an approach decision (E2E-encrypted backend vs. managed
  sync vs. cloud-drive files) before any brief.

## [2026-06-12] Backlog item 11: GitHub repo + CI auto-publish — Claude Code
- Did: Pre-push sensitive-data scan (clean — all pattern hits were policy
  text/package names; committer email noted, fine for private repo).
  Replaced placeholder `.github/workflows/agent-ci.yml` with real
  CI & Deploy workflow: validate job (npm ci, lint, format:check,
  typecheck, test, build; uploads dist artifact) on every push/PR; deploy
  job (cloudflare/wrangler-action@v3, verified current via docs) deploys
  the validated artifact to the existing `stacktrack` Pages project on
  pushes to main only. Secrets: CLOUDFLARE_API_TOKEN (user-created,
  Pages:Edit scope) + CLOUDFLARE_ACCOUNT_ID, stored in GitHub Actions
  secrets by the user — never in the repo. Remote:
  https://github.com/LarsonRogers/StackTrack (private). First push
  rejected (repo auto-initialized with MIT LICENSE); merged with
  --allow-unrelated-histories to keep the user's license choice instead
  of force-pushing. Full history pushed.
- Decisions: GitHub Actions → wrangler deploy instead of Cloudflare's git
  integration — WHY: direct-upload Pages projects cannot be converted to
  git-connected; this keeps the same URL and adds CI gating. Sync
  direction (item 12/13) decided by user: cloud-drive file flow as
  interim, E2E-encrypted backend REQUIRED before shipping to other users.
- State: Repo live, CI wired. Awaiting first green Actions run +
  auto-deploy verification (user watches Actions tab — private repo, no
  gh CLI installed).
- Watch: DoD "CI green" is now enforceable — verify the first run before
  calling item 11 done. README still describes the starter pack.

## [2026-06-12] Backlog item 11 verified and closed — Claude Code
- Did: Verified the CI→deploy pipeline objectively via `wrangler pages
  deployment list`: two new Production deployments created by the GitHub
  Action (matching the two pushes), on top of the original manual deploy.
  Item 11 done.
- State: Next: item 12 (interim cloud-drive file sync) — task brief
  pending confirmation. Brief will split foundations (device-independent
  record identity) from the merge-import flow.

## [2026-06-12] Item 12a: sync foundations (uid + updatedAt, schema v5) — Claude Code
- Did: `src/lib/identity.ts` (newUid via crypto.randomUUID, nowIso).
  Schema v5 in `src/db/db.ts`: every table gains unique `&uid` index;
  every interface gains uid + updatedAt; dependents gain uid references
  (StackEvent.itemUid, IntakeRecord.itemUid, ItemNote.itemUid,
  MetricEntry.metricUid). `backfillIdentity(host)` exported — fills
  uid/updatedAt (items/metrics first, from createdAt; intakes from
  takenAt) and wires uid refs from numeric ids; idempotent; used by BOTH
  the v5 .upgrade() and applyBundle (pre-v5 backups import clean). All
  five repositories now set uid + stamp updatedAt on every write.
  Export schemaVersion now 5. 5 new tests in tests/syncIdentity.test.ts
  (repo identity writes, uid stability + updatedAt refresh on edit,
  legacy backfill incl. reference wiring, idempotence, v4-bundle import);
  graphView/stackView test helpers updated for required fields. 75 total.
- Decisions: Keep numeric auto-increment PKs, ADD uid alongside — WHY:
  Dexie cannot change a table's primary key across versions; dual-key
  keeps all existing indexes/queries intact while uid carries cross-device
  identity. updatedAt backfill uses createdAt/takenAt where available —
  WHY: closest honest approximation of last change for legacy rows.
- State: Committed locally, NOT pushed — push auto-deploys the migration;
  user must export JSON backups on PC + phone first (v5 device DBs cannot
  downgrade; backup is the rollback path). 12b (merge import) next.
- Watch: HOLD push until user confirms backups on both devices.

## [2026-06-12] Item 12b: "Sync from file" merge import — Claude Code
- Did: User confirmed backups; 12a pushed and CI-deployed (verified: 4th
  production deployment). `src/lib/mergeData.ts`: mergeBundle(bundle,
  apply) — dry-run preview + atomic apply; parents (items/metrics) match
  by uid with newest-updatedAt-wins; stackEvents union by uid; singleton
  tables (intakes/itemNotes/metricEntries/dayNotes) match by uid THEN
  natural key (itemUid+date[+time], dayNotes by date) so independently-
  created same-day records converge instead of duplicating (local id/uid
  kept, newest payload taken); new records added with fresh local ids and
  numeric refs rewired via uid maps; orphans (unknown parent uid) skipped
  and counted, never invented; requires schemaVersion ≥ 5 (replace-import
  still accepts older files). StackScreen: "Sync from file" button +
  file input; flow = parse → dry-run → confirm with add/update counts →
  apply → "Synced: X added, Y updated" status. Backup-section copy and
  RUNBOOK phone section updated (incl. the deletion-resurrection quirk).
  8 new tests (7 engine incl. id-collision rewiring, convergence, no-
  delete, dry-run purity, self-merge no-op; 1 UI flow), 83 total.
- Decisions: Merge never deletes; tombstones deferred to item 13 — WHY:
  per confirmed brief; standard interim-file-sync trade-off, documented
  to the user in RUNBOOK. Natural-key matches keep the LOCAL uid — WHY:
  keeps later merges between the same device pair stable.
- State: Full interim sync loop usable via the user's own cloud drive.
  Queued item 14 (README rewrite, user request). Item 13 (E2E backend)
  remains the ship-to-users precondition.
- Watch: Demo gate OPEN for item 12 — full demo (real two-device merge).

## [2026-06-12] Item 14: README rewrite — Claude Code
- Did: Replaced the starter-pack README.md with StackTrack documentation:
  features, privacy model (data never leaves devices; code-only hosting;
  no analytics; not-medical-advice), live URL + install pointers, tech
  stack, dev commands, CI/deploy note, project-organization pointers
  (AGENTS/HANDOFF/DECISION_LOG/BACKLOG), MIT license. Docs-only; pack
  files (SETUP.md, TASK_TEMPLATE.md, protocols/) untouched. Resolves the
  long-standing stale-README watch item.
- State: Item 13 (E2E-encrypted sync backend) is the only substantive
  backlog item left — the ship-to-users precondition.

## [2026-06-12] Item 13 phase confirmed: E2E-encrypted sync — Claude Code
- Did: External research (current Cloudflare docs): Workers free plan
  100k req/day, 10ms CPU/invocation; D1 free 5M reads + 100k writes/day,
  5 GB — ample for device sync at $0. Phase brief presented and user
  confirmed.
- Decisions:
  - Architecture: own Worker + D1 on the user's existing Cloudflare
    account; server stores only ciphertext blobs + timestamps (E2E —
    server can never read data). WHY: more secure than any cloud-drive
    or managed-sync option; multi-user foundation.
  - Crypto: WebCrypto only (no new deps). Passphrase → PBKDF2 stretch →
    HKDF split into independent keys: group id + auth token (server-
    facing) and encryption key (never leaves device). PBKDF2 iteration
    count to be re-verified against OWASP guidance at 13b implementation
    (currently ~600k for SHA-256 per training data — flag, verify then).
  - No passphrase recovery, by design; JSON backups + local copies are
    the recovery story (user re-confirmed).
  - Tombstones (schema v6, additive) make deletions propagate — also
    retroactively fixes the file-sync resurrection quirk.
  - Tasks: 13a server, 13b crypto, 13c tombstones, 13d sync engine +
    settings UI, 13e live two-device demo.
- State: 13a (sync server) starting. Item 12 demo gate still open in
  parallel (user to run a real file merge when convenient).

## [2026-06-12] Item 13a: sync server live — Claude Code
- Did: Created D1 database `stacktrack-sync` (id ae39ad39-…) and
  `workers/sync/`: wrangler.toml, schema.sql (groups: group_id +
  SHA-256(auth token); records: seq autoincrement cursor, group_id, uid,
  cipher, updated_at, deleted; unique(group_id,uid)), src/logic.ts (pure
  validation: hex groupId, cursor, change shape, 2000-change/64KB caps;
  last-write-wins rule; bearer extraction — 8 unit tests in main suite),
  src/index.ts (POST /v1/sync: first-sync group registration, token-hash
  auth, LWW upsert via delete+insert to bump seq, delta pull by seq with
  1000 limit + more flag; /health; CORS allowlist = Pages URL +
  localhost). Worker tsconfig wired into root references;
  @cloudflare/workers-types + wrangler as devDeps; .wrangler/ gitignored.
  Integration-tested locally via wrangler dev + curl (push, cross-device
  pull, 403 wrong token, stale update ignored), then deployed — user
  registered workers.dev subdomain el-m-rogers — and re-verified live at
  https://stacktrack-sync.el-m-rogers.workers.dev (same four checks);
  live test rows deleted after. RUNBOOK gained sync-server deploy +
  teardown-with-verification sections.
- Decisions: Update = delete+insert (not UPDATE) — WHY: bumps the
  autoincrement seq so other devices' delta pulls see the change. Server
  knows only uid/cipher/timestamps; table names live inside the
  ciphertext — WHY: minimize metadata leakage. Worker deploys from local
  wrangler session, not CI — WHY: the CI token is Pages-scoped; widening
  it is a user step, deferred until the server stabilizes.
- State: 13a done (server live, all checks green). Next: 13b client
  crypto (re-verify PBKDF2 params against OWASP at build time).
- Watch: Item 12 demo gate still open. CI does not yet deploy the worker
  (manual redeploy via RUNBOOK command until token is widened).

## [2026-06-12] Item 13b: client crypto — Claude Code
- Did: Re-verified OWASP guidance live (PBKDF2-HMAC-SHA256: 600,000
  iterations — current). `src/lib/crypto.ts` (WebCrypto only, no deps):
  deriveSyncKeys(passphrase) → PBKDF2 600k stretch (NFKC-normalized
  input) → HKDF split into groupId (hex64), authToken (hex64), and a
  non-extractable AES-GCM-256 encKey; encryptRecord/decryptRecord
  (fresh 96-bit IV per record, output base64(iv||ct), GCM authenticates
  so tampering throws). 10 tests: determinism, NFKC keyboard
  equivalence, cross-passphrase independence, groupId≠authToken,
  derived values pass the SERVER's own validators (cross-checked
  against workers/sync logic), default work factor pinned, round-trip,
  fresh-IV, tamper rejection, wrong-key rejection. 101 total.
- Decisions: App-constant PBKDF2 salt ('stacktrack-sync-v1') — WHY: a
  new device must find its group from the passphrase ALONE, so no
  per-user salt can exist before auth; standard trade-off for
  passphrase-derived E2E, compensated by the 600k work factor and
  passphrase quality (13d's UI will encourage strong ones). encKey
  created non-extractable — key bytes never exist in app-readable form.
  Tests run at 1000 iterations (speed); algorithm identical, work
  factor pinned by its own assertion.
- State: 13a+13b done. Next: 13c (tombstones, schema v6).

## [2026-06-12] Item 13c: deletion tombstones (schema v6) — Claude Code
- Did: Schema v6 (additive, empty new table): `tombstones` (&uid,
  deletedAt). `src/db/tombstoneRepository.ts` recordTombstone (upsert).
  All four deleting repositories (unmarkTaken, setItemNote(''),
  clearMetricEntry, setDayNote('')) record the marker IN THE SAME
  TRANSACTION as the delete. Export/import/replace include tombstones
  (older bundles default empty). Merge engine: incoming tombstones
  delete matching local records when newer than the record's updatedAt
  (counted in new summary.deleted, shown in sync status); union of
  markers kept (newest per uid); local tombstones suppress incoming
  resurrections; a record edited AFTER its tombstone wins and retires
  the marker. 5 new tests (per-action markers; delete propagation;
  resurrection suppression; edit-beats-tombstone incl. marker
  retirement; pre-v6 bundle compatibility). 106 total.
- Decisions: Tombstones are uid-scoped, so a NEW record at the same
  natural key (re-checking a dose creates a fresh uid) is never killed
  by the old marker — intended semantics.
- Debugging note (honest record): one pre-existing UI test
  (todayScreen "attaches a daily note") began failing intermittently
  (~50-100%) in FULL-SUITE runs only. Systematic isolation: passes
  alone, passes serialized (3/3), passes instrumented with identical
  flow + DB/DOM probes (3/3), fails under parallel file workers. DB
  writes proven correct in failing configuration. Conclusion:
  parallel-worker CPU contention starving user-event/jsdom timing —
  environment-level, not an app bug. Fix: vitest fileParallelism:false
  (vite.config.ts) — suite now deterministic (multiple green runs),
  costs ~25s wall clock, also derisks 2-core CI runners. Tombstone
  clearing added to todayScreen beforeEach as hygiene (was a red
  herring for the flake, kept anyway).
- State: 13c committed, push HELD for the user backup ritual (v6
  migration is empty-table-only, mildest possible; holding on
  principle). Next: 13d (sync engine + settings UI).

## [2026-06-12] Item 13d: sync engine + Sync tab — Claude Code
- Did: Schema v7 (additive, empty): `syncState` (single row: groupId,
  authToken, encKeyHex, cursor, lastPushedAt/lastSyncedAt) — local-only,
  EXCLUDED from exports (tested: no credentials in bundle JSON).
  `src/lib/syncEngine.ts`: runSync = gather changes since lastPushedAt
  watermark (+tombstones by deletedAt) → encrypt per record →
  POST /v1/sync → decrypt pulls → apply via mergeBundle (reuses ALL
  merge/tombstone semantics); cursor loop until drained; re-entrant
  calls coalesce (pendingRerun); status pub/sub; triggers = app open +
  visibilitychange + Dexie write hooks debounced 8s (syncState
  excluded from hooks to avoid self-trigger). enableSync (derive 600k →
  store → first sync), disableSync (forget keys; data stays).
  `src/screens/SyncScreen.tsx` + 5th NavBar tab: setup form (min 8
  chars, confirm match, four-word suggestion generator, no-reset
  warning, "slow on purpose" spinner), connected view (status, last
  synced, Sync now, Disconnect w/ confirm). crypto.ts: encKey persisted
  as hex string (importEncKey) — ArrayBuffer didn't survive IndexedDB
  structured clone in the test env and is fragile generally. RUNBOOK
  updated (sync is now the primary multi-device path). 11 new tests
  (7 engine vs simulated server incl. ciphertext-only assertion,
  tombstone pull, cursor persistence, 403 + offline errors, export
  exclusion; 4 settings flow), 117 total.
- Decisions: Pulled echoes of own pushes are merged as no-ops — WHY:
  simpler than server-side echo suppression; cost is trivial decryption.
  SyncScreen had the same first()-undefined ambiguity bug as
  JournalSection (setup form never rendered for new users) — caught by
  the flow tests; fixed with the ?? null sentinel pattern.
- State: 13d done; v7 deploy covered by today's backups (empty-table
  migration). Next: 13e — live two-device demo closes the phase.

## [2026-06-16] Fix: 1–10 rating row wraps "10" — Claude Code
- Did: `.metric-rating` was a wrapping flexbox; ten buttons overflowed the
  first line so "10" wrapped and `flex:1` stretched it full-width. Switched
  to CSS grid `repeat(10, 1fr)` (button `min-width:0`, dropped `flex:1`/wrap)
  so all ten sit on one equal-width row. CSS-only; lint+typecheck clean,
  metricLogging test green.
- State: committed; held in the same backup-ritual hold as the upcoming v8
  groups migration (next task). Brief 2 (multiple groups per item) is the
  active task.

## [2026-06-16] Item 15: multiple groups per item (schema v8) — Claude Code
- Did: Replaced the single `group?: string` with `groups: string[]` on
  items AND on the change-history snapshots (stackEvents). Schema v8
  (additive + lossless): items index `status, group` → `status, *groups`
  (multi-entry); the v8 `.upgrade` runs `migrateGroups` which carries the
  old value over (group "X" → ["X"]; none → []) and touches no other
  field. New shared helpers in db.ts: `normalizeGroupsField` (row-level,
  in-place, idempotent) + `migrateGroups` (items+stackEvents). Write path
  (stackRepository): input `groups: string[]`, normalize (trim/blank-drop/
  case-insensitive dedupe, order preserved), change-summary diffs the group
  SET (reorder is not a change), event snapshots groups. Form (ItemForm):
  single text box → tag chips (type + Enter/comma to add, × or Backspace to
  remove, datalist suggestions, a still-typed draft is folded in on submit).
  Stack screen: "by group" lists an item under EACH of its groups, marked
  "in N groups" so it reads as one item not duplicates; flat-sort detail
  line shows all groups; group-section view shows the count hint. Graph
  markers (graphView): an event joins each of its groups' same-day/same-type
  batches; a solo multi-group event de-dupes to one per-item marker.
  Back-compat: `migrateGroups`/`normalizeGroupsField` also run in
  applyBundle (import) and mergeBundle (sync) so pre-v8 backups + older-peer
  pulls load cleanly. Export unchanged (arrays already serialize; CSV joins
  with "; ").
- Tests: new tests/groupsMigration.test.ts (normalizeGroupsField cases;
  LOSSLESS migrateGroups proof — every non-group field byte-identical;
  idempotent; pre-v8 import + merge normalization). Multi-group cases added
  to stackView (listed under each section), graphView (per-group batch +
  solo de-dupe), stackScreen (chips + "in 2 groups" across sections).
  Updated ~12 test files for the field rename. 129 tests pass; lint, format,
  typecheck, build all green.
- Data safety: only the v8 upgrade touches stored data and it is lossless +
  atomic (Dexie rolls back on any error) + proved by the migration test.
- Decisions: StackItemInput.groups is REQUIRED (canonical input); the form
  always supplies it. Group-set comparison ignores order.
- Honest note: the pre-existing flaky test (todayScreen "attaches a daily
  note", environment timing per 2026-06-12 entry) failed once mid-run then
  passed 3/3 in isolation and in the final full-suite run — unrelated to
  groups (daily-note flow). Not a regression.
- State: committed; PUSH HELD pending the user's pre-deploy backup ritual
  (export JSON) — the v8 migration runs on their real device on next load.
  Next: user backs up + sees it run, then push/deploy; item 13e sync demo
  still open.

## [2026-06-16] Fix CI: flaky multi-group form test — Claude Code
- Did: CI failed on the new stackScreen "puts an item in multiple groups"
  test (passed locally, flaked in CI). Two fixes: (1) ItemForm group-add now
  uses functional setForm updates (commitGroup/removeGroup + pure withGroup
  helper) so rapid successive chip adds never read stale state, and submit
  folds the draft via withGroup instead of a side-effecting return; behavior
  unchanged. (2) The test asserted via findByText('Bone'), which is ambiguous
  (Bone is both a form chip and a list section header) so it resolved while
  the form was still open and the synchronous count ran too early — switched
  to findByLabelText for chips and waitFor on the unambiguous 'Vitamin D'
  list count. Verified stable 5/5 runs; full suite 129 green; lint, format,
  build clean.
- State: committed + pushed; CI should go green. (Unrelated CI warning noted:
  actions/checkout@v4 + setup-node@v4 run on Node 20, deprecated June 2026 —
  bumping them is a CI-config change, needs user OK; left as a watch item.)

## [2026-06-16] Fix CI flake: todayScreen "attaches a daily note" — Claude Code
- Did: Reproduced the long-standing flake locally (1-in-4 full-suite runs).
  Root cause was the TEST, not the app: (1) findByText('ran out of pills')
  is ambiguous — it also matches the OPEN editor textarea's content, so it
  could pass as a false positive while the save hadn't landed; (2) the
  follow-up "Edit note" assertion was synchronous, so it raced the
  live-query re-render. First tried userEvent.setup({ delay: null }) across
  UI tests — it made THIS test fail 20/20 (the Save click stopped landing),
  so reverted it entirely. Real fix (test-only): after typing, waitFor the
  textarea to actually hold the text (guards lost keystrokes under load —
  an empty draft would clear, not set, the note), then assert the
  unambiguous saved end-state via findByRole('Edit note') (appears only once
  the write commits and the editor closes), then check the note text.
- Verified: previously-flaky test 25/25, full suite 3/3; lint, format,
  typecheck, build all green.
- State: committed + pushed. Watching CI to confirm green.

## [2026-06-16] Wave 1: Med/Supp badge + groups on Today cards — Claude Code
- Did: Today checklist cards now show the kind badge (Med/Supp, reusing the
  Stack screen's kind-badge styling) and the item's groups in the detail
  line (dose · group1, group2). Display only — no schema change, no new
  writes. TodayScreen.tsx only. 1 new test (badge + groups render on a
  card). 130 tests pass; lint/format/typecheck/build green.
- State: committed + pushed (no migration, safe deploy). First of the
  feature waves. Next: Wave 2 — persistent per-item note + optional
  med/supp unit field (user added the unit field to scope; one design
  question pending on dose↔unit relationship before building).

## [2026-06-16] Wave 2: optional dose unit + persistent per-item note — Claude Code
- Did: Added two OPTIONAL fields to StackItem — `unit` (dose unit) and `note`
  (persistent note). No schema migration needed: Dexie only versions indexes
  and neither field is indexed, so they ride along on writes (no v-bump, no
  backup ritual, safe deploy). Write path: StackItemInput gains unit/note;
  normalizeInput trims (blank → undefined); buildChangeSummary reports
  `unit: X → Y` and flags note edits as `note updated` (concise — the note
  text can be long and would pollute history/graph-marker labels); updateItem
  `before` snapshot includes both so edits are detected. Form: unit input
  beside dose (datalist of common units: mg, mcg, IU, mL, capsule…), dose
  placeholder now "500"; persistent-note textarea with a "shows on Today"
  hint. Display: dose+unit joined ("500 mg") on BOTH Today and Stack detail
  lines; persistent note under the name on Today (today-item-pinned-note,
  distinct from the per-day italic note) and on the Stack row. Export/merge
  unchanged (whole-record copy carries the new fields; old bundles simply
  lack them).
- Decisions (user): unit is a SEPARATE field joined for display (no parsing
  of existing doses — non-destructive); note changes ARE recorded via
  updateItem so they sync + have history (accepted the minor graph marker).
- Tests: change-summary unit+note; Today shows joined dose+unit + pinned
  note; Stack form saves unit+note. 133 tests pass; lint/format/build green.
- State: committed + pushed. Next: Wave 3 — composite measurements + boolean
  kind + rename Metrics→Tracking (schema change; backup ritual will apply).

## [2026-06-16] Wave 3-A (pulled forward): Today-card layout cleanup — Claude Code
- Did: Fixed the live Wave-1 regression where Today cards squished
  badge+dose+groups onto one row. Restructured the TodayScreen card to mirror
  the Stack card: the checkbox now sits beside a vertical text block
  (.today-item-text) holding a name row (name + kind badge, .today-item-name-row)
  over the muted detail line (dose+unit · groups). Checkbox top-aligned
  (.today-item-check align-items: flex-start). CSS + JSX only; no schema, no
  new writes. 133 tests still green (text-based assertions unaffected); lint/
  format/build clean.
- State: committed + pushed (safe deploy). Wave 3 remaining: B composite
  measurements, C boolean kind, D rename Metrics→"Tracking".

## [2026-06-16] Wave 3-B: composite measurements (new metric kind) — Claude Code
- Did: Added a third MetricKind 'composite' — a metric whose value is several
  numbers logged together (e.g. Blood Pressure = Systolic + Diastolic). NO
  schema migration: `Metric.components` and `MetricEntry.values` are not
  indexed, so they ride along on writes exactly like W2's unit/note (no
  v-bump, no backup ritual, safe deploy — corrects the W2-log guess that
  Wave 3 would need a schema change). MetricEntry.value mirrors values[0] so
  every existing single-value reader (graphs, tooltips, CSV) keeps working.
  New write path setCompositeEntry validates at the boundary: value count
  must equal the component count and all values finite; kind must be
  composite. components are fixed after creation (like kind) — MetricUpdate
  unchanged. Form: a "Multiple numbers" radio reveals dynamic part rows
  (name + optional unit) mirroring ItemForm's "times" pattern; ≥2 named
  parts required. Logger: N number inputs, Save writes all, display "120/80";
  all-empty clears. Graphs: one Recharts <Line> per component (function
  dataKey reads values[index]) on one chart with a <Legend>, palette in
  graphView.COMPONENT_COLORS. Export/import/merge untouched (whole-record copy
  carries the new fields).
- Decisions (user): 3 commits B→C→D (one logical change each); composite
  graph = multiple lines on one chart (not separate charts).
- Tests: +10 — repository (components stored, values logged + value mirror,
  re-log replaces, count/finite/wrong-kind rejections), buildCompositeSeries
  (filter+sort, skips non-composite), UI (define via form, log → "✓ 120/80").
  143 tests pass; lint/format/typecheck/build all green.
- State: committed (local only — not pushed). Next: Wave 3-C boolean kind.

## [2026-06-16] Wave 3-C: boolean (yes/no) metric kind — Claude Code
- Did: Added MetricKind 'boolean' for yes/no tracking (e.g. "Exercised
  today?"). NO schema change — value 0/1 reuses the existing required `value`
  field and the existing setMetricEntry/clearMetricEntry write paths (no new
  repository function). Boundary validation added: a boolean entry must be
  exactly 0 or 1. Form: a "Yes / no" radio (no unit, no components). Logger:
  a sliding No/Yes switch — a real checkbox kept for accessibility/behavior
  (aria-label = metric name) but visually hidden behind a CSS track+thumb
  slider; checked writes value 1, unchecking clears the day's entry.
  kindLabel = "yes/no". Graphs: 0/1 step line (Recharts type="stepAfter"),
  yDomain [0,1] with No/Yes Y-axis tick labels and a Yes/No tooltip.
- Decisions (user): logger is a sliding switch, not a default-No checkbox
  (asked for mid-task; UI may be revamped later). Functionality approved
  before the switch tweak.
- Tests: +3 — repository (checked stores 1; rejects values other than 0/1),
  UI (toggle on writes 1, toggle off clears). 146 tests pass; lint/format/
  typecheck/build all green.
- State: committed (local only — not pushed). Next: Wave 3-D rename
  Metrics tab → "Tracking" (label only, no file/type renames).

## [2026-06-16] Wave 3-D: rename Metrics tab → "Tracking" (label only) — Claude Code
- Did: Renamed the user-facing tab/heading from "Metrics" to "Tracking".
  LABEL ONLY — no file/type/route renames: MetricsScreen, metricRepository,
  MetricKind, the `metrics` Dexie table, and the `view: 'metrics'` route key
  are all unchanged (kept the diff small + safe). Changed: NavBar tab label,
  MetricsScreen <h1> + subtitle, GraphsScreen empty-state + the visually-
  hidden metric-selector label, TodayScreen "Daily metrics" section, the
  import/restore summary count, and MetricForm title/submit. Updated the 2
  test strings that assert the tab/empty-state copy. No schema, no new writes.
- Decisions (user): tab/heading = "Tracking", but the per-item noun stays
  "metric(s)" — user reverted an initial "tracker" wording I tried mid-task
  ("3 metrics", "+ Add metric", "Add a metric", "Daily metrics" all keep the
  word "metric"). Only the tab/screen title is "Tracking".
- Tests: no new tests (pure copy change); 2 existing strings updated. 146
  tests pass; lint/format/typecheck/build all green.
- State: committed (local only — not pushed). Wave 3 COMPLETE (A+B+C+D).
  Whole wave is local-only; nothing deployed since e287af9. Awaiting user
  go-ahead to push (CI auto-deploys the app on push).

## [2026-06-16] Events feature — Part 1: data + repo + Today UI + sync — Claude Code
- Did: New `healthEvents` table (HealthEvent: date, label, category) for
  discrete per-day health events ("Fever", "GI Doc Appointment",
  "Appendectomy") — MANY per day, each individually deletable, distinct from
  the one-per-day journal note. Additive schema v9 (empty new table, no
  migration — same shape as v6 tombstones / v7 syncState). EventCategory =
  symptom | appointment | procedure | other (organizational only; NO medical
  interpretation). New healthEventRepository (add/update/delete); delete
  records a tombstone in the same transaction (mirrors clearMetricEntry).
  New EventsSection.tsx on the Today screen (date-scoped, label input +
  category select + add; list with colored category badge + remove). Shared
  CATEGORY_LABELS/ORDER in lib/events.ts (kept out of the component file for
  the react-refresh lint rule; Part 2's graph legend reuses it). Registered
  the table in every enumeration site: exportData, importData (TABLE_NAMES +
  applyBundle), mergeData (DATA_TABLES + uid-only dependent — parent-less, no
  natural key: two identical labels on a day are distinct), syncEngine
  (DATA_TABLES + emptyBundle; hooks auto-attach). importData already defaults
  missing tables to [] so older bundles stay importable.
- Plan: see C:/Users/larso/.claude/plans/abstract-wondering-beacon.md.
  Remaining: Part 2 graph markers, Part 3 collapsible Today sections, Part 4
  backlog/docs (push reminders + HealthKit as future items).
- Tests: +8 — healthEventRepository (add/trim/many-per-day/edit/delete-tombstone),
  Events UI (add+badge+remove), merge dedup-by-uid, export round-trip count +
  schemaVersion 9. 154 tests pass; lint/format/typecheck/build all green.
- State: committed (local only — not pushed). Researched + decided: push
  reminders and Apple Health are FUTURE backlog items (HealthKit needs a
  native Capacitor wrapper; push needs a Cloudflare Cron + web-push backend).

## [2026-06-16] Events feature — Part 2: events as graph markers — Claude Code
- Did: Logged health events now render as vertical markers on the metric
  graphs, a distinct layer from stack-change markers. graphView.ts:
  EVENT_CATEGORY_COLORS (rose/blue/violet/slate — distinct from the stack
  green/amber/red) + buildEventMarkers(events, startDate) → lightweight
  EventMarker (one per event, NOT collapsed; color by category).
  GraphsScreen.tsx: reads db.healthEvents, renders event ReferenceLines with a
  distinct dash ("2 2" vs stack "5 3"), adds a "Health events in this period"
  legend list, and includes event ts in the x-domain candidates. Legend reuses
  CATEGORY_LABELS from lib/events.ts.
- Tests: +3 — buildEventMarkers (range-filter + sort + category color;
  same-day events not collapsed); GraphsScreen lists health events with the
  "Symptom: Fever" legend row. 157 tests pass; lint/format/typecheck/build green.
- State: committed (local only). Next: Part 3 collapsible Today sections.

## [2026-06-16] Events feature — Part 3: collapsible Today sections — Claude Code
- Did: New CollapsibleSection.tsx — a today-section whose body hides via a
  heading toggle button (aria-expanded); open/closed persists per section in
  localStorage (stacktrack:section:<key>). Default OPEN so first-time and
  screen-reader users always see content; localStorage failures degrade to
  default (try/catch). Applied to the secondary sections: Events + Journal
  (refactored those components to render through CollapsibleSection) and the
  inline "Daily metrics" + "Also recorded this day" sections on TodayScreen.
  Scoped deliberately: the primary time-grouped checklist stays always-on (you
  shouldn't be able to hide your main task list). CSS: .section-toggle inherits
  the muted uppercase h2 look; .section-caret (▾/▸).
- Tests: +2 — collapse hides the body + flips aria-expanded; collapsed state
  survives a fresh render (localStorage). 159 tests pass; lint/format/
  typecheck/build green.
- State: committed (local only). Next: Part 4 backlog + docs (push reminders +
  HealthKit as future items), then demo + offer push.

## [2026-06-16] Events feature — Part 4: backlog + future items (docs) — Claude Code
- Did: BACKLOG updates — added item 18 (Health events), 19 (Collapsible Today
  sections), and two FUTURE items from this session's research: 20 (Push/dose
  reminders — Cloudflare Cron + web-push + subscription endpoint + custom SW;
  iOS Home-Screen-only) and 21 (Apple Health — NOT possible in a pure PWA;
  needs a native Capacitor wrapper + App Store). Corrected item 17 status to
  shipped/live. Docs only — no code.
- State: committed (local only). Events feature (Parts 1–4) complete; 159
  tests green. Next: demo on the dev server, then offer to push (CI
  auto-deploys on push).

## [2026-06-16] Today card: align both notes under the name/dose — Claude Code
- Did: Moved both the persistent per-item note (.today-item-pinned-note) and
  the editable per-day note (.today-item-note) INSIDE the today-item-text
  block (as spans, after the detail line), so they sit flush under the
  name/dose — mirroring how .stack-item-note sits inside stack-item-info on
  the Stack card. Dropped the old 1.875rem magic left margin on both (it
  approximated the checkbox offset and left the notes slightly left of the
  text). Persistent note stays plain; per-day note stays italic+muted so the
  two remain distinguishable. The note editor stays at the row level. CSS +
  TodayScreen JSX only; no schema, no new writes, no behavior change.
- Tests: none added (pure layout); existing todayScreen note tests assert the
  text is present and still pass. 159 tests pass; lint/format/typecheck/build green.
- State: committed + pushed (safe deploy — CI auto-deploys the app).

## [2026-06-16] Refresh README + backlog sync first-push fix (docs) — Claude Code
- Did: (A) Updated README Features/Privacy/Tech-stack to match the shipped app —
  "Tracking" (not Metrics), composite + boolean trackers, dose unit, persistent
  per-item note, multiple groups per item, health events + their graph markers,
  collapsible Today sections, and optional E2E-encrypted cross-device sync (not
  just file merge); privacy section now explains the optional sync server holds
  only ciphertext it can't read; tech stack notes the Cloudflare Worker + D1
  backend. React stays 19 (matches package.json). (B) Backlog: corrected items
  18/19 to shipped/live; added item 22 (chunk the first sync push — see below).
- Sync scalability (user question): sync is ALREADY incremental — push sends
  only records newer than lastPushedAt (syncEngine.ts:122); pull is seq>cursor,
  paged 1000 (workers/sync). Per-record encryption; ~0.5 MB encrypted/year — a
  non-issue. No "days at a time" work needed. ONE real gap (backlogged, not
  fixed): the push sends ALL changed records in one POST (syncEngine.ts:165) and
  the server rejects >2000/push (logic.ts:37) → a first sync of a large backlog
  fails. Fix deferred to item 22 (chunk pushes ≤500 + loop). User chose
  README-now, backlog-the-fix.
- Tests: none (docs only). format:check clean (prettier covers .md). 159 tests
  unchanged (no source/test files touched).
- State: committed (local only — not pushed). Awaiting user go-ahead to push.

## [2026-06-18] Upgrade starter pack v12.0 → v12.16 — Claude Code
- Scope: user asked to "update ai starter pack"; source confirmed as GitHub
  repo LarsonRogers/AI_Agent_Starter_Pack (target v12.16, 2026-06-16). Ran
  protocols/upgrade.md (from the new pack) on branch pack-upgrade/v12.16.
  Pack files are restricted — this is the explicit "update the pack" exception.
- Did (pack-owned, replaced wholesale): CLAUDE.md, TASK_TEMPLATE.md, SETUP.md,
  all 33 protocols (22 updated + 10 new: enforcement-tooling, model-tiering,
  project-stakes, requirements, review, secure-coding, session-start,
  task-workflow, update-check, upgrade). AGENTS.md SPLICED — target Part 1 +
  preamble, project Part 2 preserved verbatim (verified byte-identical on both
  preserved chunks). Header bumped to v12.16.
- Part 2 reconciliation: two NEW sections added and FILLED (per Step 7, not left
  NOT-SET) — Project Stakes = **Production** (deployed PWA + sensitive health
  data); Model Tiers = FULL profile, Anthropic via Claude Code, tier map
  Capable=claude-opus-4-8 / Light=claude-haiku-4-5. Added the "Pack source" row
  to Related Docs (new in-section field; referent for update-check.md).
- Decisions (4, user-confirmed): (1) Production stakes; (2) set up Light tier →
  activated .claude/agents/light-checker.md (model: haiku); (3) adopt security
  CI gates → grafted security job (trufflehog + semgrep + npm audit) into
  agent-ci.yml and gated deploy on needs:[validate,security]; added
  .github/dependabot.yml (npm, weekly); (4) wire the opt-in pack-update notify
  hook → copied .claude/hooks/check-pack-update.sh + registered SessionStart
  hook in .claude/settings.json.
- Config diffs: .claude/settings.json, .codex/config.toml, opencode.json were
  content-identical (line-endings only) — no change. .gitignore KEPT (project
  superset: Vite/PWA/.wrangler entries). .gitattributes gained `*.sh text eol=lf`.
  CI+deploy workflow KEPT (project's configured version; not overwritten with
  the generic template). Shipped inert light-checker.*.example templates for all
  three harnesses (tri-harness parity).
- Self-checks (Step 6): version grep — all root files + 33 protocols at v12.16;
  ls-vs-index both directions clean; no dangling protocol cross-refs;
  project-owned files (README/DECISION_LOG/HANDOFF/BACKLOG/RUNBOOK/src/tests)
  byte-for-byte untouched; settings.json valid JSON, both YAMLs parse.
- Review (Step 7): independent fresh-context review of the hand-edited surfaces
  (AGENTS.md splice, CI graft, hook wiring, tier file) — zero blockers; one
  benign warning ([PROJECT_NAME] H1 placeholder, pre-existing on main).
- Tests: not applicable — no src/ or tests/ change (pack/config/docs only); 159
  app tests unaffected. CI security job + dependabot will exercise on next push.
- State: committed on branch pack-upgrade/v12.16 (NOT merged to main — per
  upgrade.md, the user merges when ready). main left untouched.

## [2026-06-18] Triage: scope CI dependency audit to production deps — Claude Code
- Trigger: first CI run after the pack upgrade (commit 14401ab) FAILED on the
  new `security` job — specifically `npm audit --audit-level=high`. validate
  (lint/type/test/build) passed; trufflehog + semgrep passed; deploy correctly
  SKIPPED (needs:[validate,security]) so the live site was never touched.
- Findings (5: 1 low, 4 high): esbuild (dev-server file read, Win), undici
  (TLS bypass / cache disclosure), ws (DoS), miniflare, wrangler. ALL are
  devDependencies — wrangler (deploy CLI) + its transitive chain, and vite's
  esbuild. Verified: `npm audit --omit=dev --audit-level=high` → 0 vulns.
  Production deps (react, react-dom, dexie, dexie-react-hooks, recharts) are
  clean; the deployed Cloudflare Worker runs on workerd (native fetch), not
  these packages. Zero production/user exposure.
- Decision: scope the BLOCKING audit step to `npm audit --omit=dev
  --audit-level=high` (production deps = what actually ships). Rationale:
  static client bundle + Cloudflare-runtime worker; dev/deploy-tooling CVEs
  don't reach users, and a clean full fix would need a breaking wrangler major
  (`npm audit fix` non-force didn't clear the highs; --force = wrangler major).
  Dependabot (weekly, added this upgrade) tracks dev-tooling updates
  non-blocking; trufflehog + semgrep still gate every push. Justification
  comment added inline in agent-ci.yml.
- Alternative considered + rejected for now: `npm audit fix --force` to bump
  wrangler to a non-vulnerable major — deferred (risk to deploy tooling >
  benefit, since no production exposure). Can revisit via a dependabot PR.
- Tests: no source/test change. Production audit clean. CI re-run on push.
- State: committed on main + pushed (CI re-triggers; deploy should now unblock).

## [2026-06-18] Backlog #23: Metric notes (persistent + per-day) — Claude Code
- Trigger: user requested three additions (metric note, med frequency, in-app
  reminders). Clarified scope via four questions: (#1) metric note = BOTH a
  persistent definition note AND a per-day note; (#2) frequency = every N days
  + days-of-week + on/off cycles; (#3) reminders = in-app now / push later,
  covering cycling advisories + recurring + one-off. Split into three backlog
  items (23/24/25); built #23 first. Confirmed brief: add a persistent `note?`
  to Metric (mirrors StackItem.note) + a new per-day `metricNotes` table
  (mirrors itemNotes, one per metricId+date).
- Implementation (additive, schema v10 — empty new table, no migration):
  - db.ts: `Metric.note?`; new `MetricNote` interface + table; `version(10)`
    with index `++id, &uid, date, [metricId+date]`.
  - New `metricNoteRepository.setMetricNote` — exact twin of itemNoteRepository
    (uid+updatedAt on writes, tombstone on clear, [metricId+date] upsert).
  - metricRepository: `note` on MetricInput/MetricUpdate, persisted on add+update.
  - UI: MetricForm note textarea (all kinds); MetricsScreen forwards note on
    edit; MetricLogger shows the persistent note + a per-day note editor;
    TodayScreen live-queries metricNotes for the date and passes them down.
  - Carried metricNotes through EVERY data path: exportData (bundle type+read),
    importData (TABLE_NAMES+tx), mergeData (DATA_TABLES+tx+dependents w/
    metricUid rewiring + natural key metricUid|date), syncEngine
    (DATA_TABLES+emptyBundle).
- Decisions: (1) per-day note placement = under the logging control in
  MetricLogger, consistent with the Today item-note pattern. (2) Kept the
  missing-parent fallback (`metricUid: metric?.uid ?? ''`) to mirror the
  itemNoteRepository precedent the brief specified — UI guarantees the parent
  exists; an empty ref would be skipped (never mis-wired) on merge. Noted as a
  symmetry nit, not fixed.
- Security self-check (touches stored data): free text trimmed, stored in local
  IndexedDB, rendered via React auto-escaping (no dangerouslySetInnerHTML) — no
  injection vector; no new secrets/deps; sync is table-agnostic + already
  E2E-encrypted. PASS.
- Review: independent fresh-context diff review — ZERO blockers; two nits
  (missing-parent fallback symmetry; suggested a metricNotes merge-convergence
  test). Added the merge-convergence test (nit 2); left nit 1 per precedent.
- Tests: new tests/metricNote.test.ts (persistent note add/update/clear; per-day
  one-per-day, replace, clear+tombstone, no-op clear) + metricNotes merge
  convergence + export coverage + schemaVersion 9→10. Full suite 168 green
  (was 159). Lint/format/typecheck/build all pass.
- State: committed on branch feature/metric-notes (NOT merged/pushed — awaiting
  user demo confirmation). Backlog: 23 done; 24 + 25 added as planned.

## [2026-06-18] Backlog #24: Med/supplement frequency — Claude Code
- Trigger: 2nd of the three requested additions. Confirmed pre-flight plan
  (cross-cutting, ~8 files). Scope: items can recur on a cadence; Today + any
  dated view show an item only on days it's due. Confirmed defaults: cycles in
  WEEKS; everyNDays/cycle anchor to an editable start date defaulting to today;
  not due before start.
- Data model: optional `schedule?` on StackItem — ABSENT = every day (no schema
  migration, no version bump; non-indexed field rides export/import/merge/sync
  as a plain field). Discriminated union: everyNDays{n≥2,startDate} |
  daysOfWeek{days 0-6} | cycle{onWeeks,offWeeks,startDate}.
- New pure `lib/schedule.ts`: isDueOn/isScheduleDueOn (undefined⇒due daily;
  offset<0 ⇒ not due before start; everyNDays offset%n===0; daysOfWeek local
  getDay membership; cycle offset%period < onWeeks*7) + describeSchedule
  ("Every other day"/"Mon, Wed, Fri"/"3 weeks on, 1 week off"). DST-safe:
  parseIsoDate anchors at noon, daysBetween uses Math.round on ms delta.
- stackRepository: `schedule` on StackItemInput; normalizeSchedule collapses
  degenerate cases (n<2 / 0 or 7 weekdays / on|off<1) to undefined=daily — so
  NO input can yield a never-due item; scheduleKey (JSON of normalized) drives
  change-summary equality; a frequency change records a 'changed' StackEvent →
  graph marker (consistent with "every stack change is recorded"). before-snap
  includes schedule.
- buildTimeSections(items, date) now filters by isDueOn; TodayScreen passes
  selectedDate. Past-day not-due items drop off the checklist but recorded
  intakes still surface via the existing "Also recorded this day" path. Stack
  card shows the cadence label.
- ItemForm: Frequency fieldset (Every day / Every N days / Specific days /
  Cycle) seeded from the item's schedule, with per-kind validation. CSS added.
- Review nit fixed: toCsvValue now JSON-serializes plain objects (an item's
  schedule) instead of "[object Object]" — CSV stays lossless; JSON export
  remains the canonical restore.
- Security self-check (input + stored data): schedule is structured data
  validated at the repo boundary; isDueOn is pure date math; no free-text
  injection, no auth/secrets; rides existing E2E-encrypted sync. PASS.
- Review: independent fresh-context diff review — ZERO blockers. Verified date
  math + cycle boundaries, normalize/build round-trip (no never-due item),
  change-equality stability, caller updates, data-flow. Three nits: CSV object
  (FIXED), redundant weekday re-sort in describeSchedule (left — defensive),
  large-n cap (out of scope).
- Tests: new schedule.test.ts (every kind + start/cycle boundaries +
  describeSchedule), todayView.test.ts (date filtering), stackRepository
  schedule change-summary + normalization, toCsvValue object case. Full suite
  183 green (was 168). Lint/format/typecheck/build all pass. Line endings:
  prettier --write normalized working-tree CRLF→LF (autocrlf artifact from the
  branch checkout; committed blobs already LF, no content change to #23 files).
- State: committed on branch feature/item-frequency (NOT merged/pushed —
  awaiting user demo confirmation). Backlog: 24 done; 25 (reminders) next.

## [2026-06-18] Backlog #26: Navigation restructure (bottom bar + settings cog) — Claude Code
- Trigger: while planning #25 (reminders), the 5-tab bottom bar was already
  crowded and a 6th tab (Reminders) would worsen it. User chose: bottom bar =
  the "view" screens (Today, Graphs); a top-right settings cog opens the "set
  up" screens (Stack, Tracking, Sync — Reminders joins in #25). Split into its
  own task before the reminders feature (independent, low-risk).
- Cog placement (per explicit user spec): on the Today header the cog's TOP is
  flush with the "StackTrack" heading and its BOTTOM flush with the date line,
  with DateNav below — implemented via a flex row (.today-header-bar:
  align-items stretch; the date's 1.5rem bottom-margin moved to the row). Other
  screens (.screen-header) pin the cog top-right at its natural height (review
  warning: the populated Graphs header has no subtitle, so the original
  bottom:1rem anchor was inconsistent — changed to top-anchored natural height).
- Implementation: NavBar tabs reduced to Today+Graphs (View type unchanged —
  all 5 views still reachable); new NavContext (App provides {active, navigate};
  avoids prop-drilling) so any screen header can drop in <SettingsMenu/>; new
  SettingsMenu (cog + dropdown; toggle, navigate-and-close, Escape-close,
  backdrop-close, active item marked via aria-current). All 5 screens render
  <SettingsMenu/> in their header (Today restructured; Graphs×2/Sync×2/Stack/
  Metrics append it inside .screen-header). CSS for the cog/dropdown/backdrop
  (z-index 10/11 over the fixed navbar).
- Menu items are plain buttons (role intentionally NOT menuitem) so they stay
  queryable as buttons and need no roving-tabindex — reasonable for 3 items;
  arrow-key menu nav is the only thing forgone.
- Tests: existing flow tests (stackScreen×7, metricLogging×2, syncScreen×1)
  updated to open the cog (findByRole 'Settings' — the cog lives inside a screen
  that renders null until live queries resolve, so it's awaited, unlike the old
  always-present NavBar buttons) before navigating. New settingsMenu.test.tsx
  (bar/cog split, closed-by-default, open→navigate→close, Escape, backdrop,
  active-marking) — 5 tests. Full suite 188 green (was 183).
- Review: independent fresh-context review — ZERO blockers. One warning
  (subtitle-less Graphs header cog alignment) FIXED. Nits left: no focus
  trap/restore into the dropdown (acceptable for a small PWA), aria-haspopup
  semantics — non-blocking follow-ups.
- Security: N/A — pure navigation/UI; no input/auth/stored-data/secrets.
- Lint/format/typecheck/build all pass.
- State: committed on branch feature/nav-restructure (NOT merged/pushed —
  awaiting user demo confirmation). #26 done; #25 (reminders) next, will add a
  "Reminders" entry to the cog menu.

## [2026-06-18] Backlog #25 Task B: In-app reminders (core) + nav cog polish — Claude Code
- Scope: 3rd requested addition (reminders), built as Task B of the agreed
  3-part plan (A nav = #26 done; B core = this; C per-occurrence history =
  fresh session). User folded a nav-cog polish into this branch and asked NOT
  to redeploy yet.
- Nav cog polish (CSS only): cog is now a fixed 2.75rem padded SQUARE on every
  screen (was stretching to the title block on Today); align-items flex-start on
  .today-header-bar + .settings-menu so it pins top-right; .settings-menu gains
  z-index:20 so the dropdown floats above page content (Graphs chart was
  overlapping it). NOT yet visually verified by the agent — user to confirm.
- Reminders data model (schema v11, additive new `reminders` table): Reminder
  { text, itemUid?, recurrence: once|everyNDays|cycle, time?, lastAckedDate?,
  snoozedUntil?, status }. Recurrence is DECLARATIVE (occurrences computed, not
  materialized) so a future push backend (#20) can reuse the logic. Reminders
  archive (never hard-delete); ride export/import/merge/sync as a parentless
  uid-only table (like healthEvents — itemUid is a label, no numeric ref).
- Pure lib/reminders.ts: currentOccurrence (most recent occurrence ≤ today;
  cycle fires at each off-period start = startDate + onWeeks*7 + k*period),
  isReminderDue (active + occurrence + not-acked + not-snoozed), describeRecurrence.
  DST-safe (noon-anchored parseIsoDate + Math.round).
- reminderRepository: add/update/archive/unarchive + acknowledgeReminder (sets
  lastAckedDate to the dismissed occurrence, clears snooze, auto-archives a
  'once') + snoozeReminder (snoozedUntil = today + N days, floor 1). normalize
  floors counts ≥1.
- Decisions (recommended defaults, user approved "proceed"): snooze = inline
  N-days input default 1; time-of-day NOT clock-gated in-app (orders the list +
  ready for push); 'once' auto-archives on Done; linked item prefixes the
  advisory ("KSM-66 — …").
- UI: View += 'reminders'; App.SCREENS + SettingsMenu menu entry; new
  RemindersScreen (CRUD, cog menu) + ReminderForm (text/kind/time/linked item)
  + RemindersSection (Today advisory, due-only, Done + Snooze). Advisory mounts
  on Today only when selectedDate === today.
- Review fix (independent review, ZERO blockers, 1 warning FIXED): updateReminder
  now CLEARS lastAckedDate/snoozedUntil when the recurrence changes (the grid
  shifts, so a stale ack would wrongly suppress the edited reminder); preserves
  them for text/time-only edits. Added a test. Nits (dead isInteger guard,
  fire-and-forget repo calls per codebase pattern, sort sentinel) left as-is.
- Security self-check (input + stored data): text trimmed + React auto-escaped;
  counts validated at the boundary; dates/time pure math; itemUid is a Map-key
  not a query; no secrets; rides E2E-encrypted sync. PASS.
- Tests: reminders.test.ts (occurrence/due/snooze/ack boundaries +
  describeRecurrence), reminderRepository.test.ts (CRUD + ack auto-archive +
  snooze + recurrence-change ack-reset), remindersSection.test.tsx (Today Done
  + Snooze end-to-end), exportData schemaVersion 10→11. Full suite 209 green
  (was 188). Lint/format/typecheck/build pass.
- State: committed on branch feature/reminders (CSS polish + Task B together).
  NOT merged/pushed — per user, hold the redeploy; user verifies the cog/dropdown
  polish + reminders visually, then merges. Backlog: #25 Task B done; Task C next
  session. #26 (nav) already on main.

## [2026-06-18] Backlog #25 Task C: Per-occurrence reminder history — Claude Code
- Scope: final part of the agreed 3-part reminders plan (A nav = #26; B core
  = Task B; C = this). One logical change: record each Done/Snooze action and
  surface a per-reminder history view. Cross-cutting (new table through the 4
  sync libs + UI + tests); short pre-flight plan confirmed with the user first.
- Data model (schema v12, additive empty table — no migration, mirrors v9/v11):
  ReminderEvent { id, uid, reminderUid, occurrenceDate, action: 'done'|'snoozed',
  snoozedUntil?, at, updatedAt }. Index '++id, &uid, reminderUid'. Parentless
  uid-only: reminderUid is a LABEL (like Reminder.itemUid), never a rewired
  numeric ref — modeled exactly like healthEvents in merge. Append-only history;
  rows never edited/deleted.
- Repository: acknowledgeReminder + snoozeReminder now wrap the reminder update
  AND the event-append in ONE db.transaction('rw', reminders, reminderEvents).
  Both compute occurrenceDate identically (currentOccurrence ?? today) so the
  recorded occurrence matches what isReminderDue suppresses; snooze now reads
  the reminder (mustGet) to get its uid + recurrence. A single nowIso() stamp is
  shared by the reminder's updatedAt and the event's at/updatedAt (sync sees one
  moment). Call sites (Today's RemindersSection) unchanged.
- Sync wiring (the critical risk — verified complete in all four): exportData
  (bundle type + read + assembly), importData (TABLE_NAMES + tx scope), mergeData
  (DATA_TABLES + tx scope + dependents union + uid-only dependent entry, no
  refMap), syncEngine (DATA_TABLES — also drives gather/push/pull allow-list/
  write-hook triggers — + emptyBundle). Merge convergence: each device mints its
  own uid per action, uid-only match → identical taps on two devices are two
  distinct rows (intended append-only semantics, same as healthEvents).
- UI (RemindersScreen): active reminders with ≥1 event show a "History (N)"
  toggle (hidden at 0); expand shows each action newest-first (sorted by tap
  time `at`, not occurrenceDate, to distinguish multiple actions on one
  occurrence) as "Done" / "Snoozed until YYYY-MM-DD" + the occurrence date.
  One panel open at a time (expandedHistory = reminder.uid). aria-expanded +
  aria-controls→panel id (review nit, fixed). New .reminder-item flex-wrap +
  .reminder-history styles so the panel wraps to a full-width row below.
- Tests: reminderRepository.test.ts +3 (done event tied to reminder+occurrence;
  snoozed event carries snoozedUntil; accumulates one row per action across
  occurrences). New remindersScreen.test.tsx (toggle hidden until events;
  expand shows actions newest-first + collapse). Fixtures: exportData
  schemaVersion 11→12; mergeData bundleWith + tombstones emptyBundle add
  reminderEvents: []. Full suite 214 green (was 209).
- Review: independent fresh-context review — ZERO blockers. Nits: aria-controls
  (FIXED); raw ISO date display (deliberate app-wide convention, left).
- Security self-check (stored data): event rows carry only generated uid, a
  reminderUid from an existing record, computed local dates, an enum-literal
  action, and timestamps — no new free-text input surface (reminder text already
  trimmed/escaped upstream; React auto-escapes the render). Dexie key queries,
  not string-built. No secrets; rides E2E-encrypted sync. PASS.
- Note: Windows autocrlf — `prettier --write .` rewrote EOL on ~10 untouched
  files; reverted those (EOL-only, LF blob unchanged) to keep the diff scoped to
  the 8 source + 5 test files actually changed.
- Lint/format/typecheck/build all pass. User confirmed the live demo.
- State: committed on branch feature/reminders-history (also carries the earlier
  Reminders add-button spacing fix 1f8a6ee). Merged to main + pushed. Backlog
  #25 (in-app reminders, Tasks A/B/C) COMPLETE.

## [2026-06-18] Upgrade starter pack v12.16 → v12.19 — Claude Code
- Trigger: user explicitly asked to upgrade the pack (the one case pack-owned
  files may be edited). Launch hook had reported v12.18, but the actual upstream
  main reads v12.19 (dated today) — reported the real version and targeted it.
  Ran protocols/upgrade.md by hand, source v12.16 → target v12.19, on branch
  pack-upgrade/v12.19. Upstream cloned to a temp dir as the copy source (not
  reconstructed from memory).
- Pack-owned replaced wholesale: all 33 protocols/*.md, CLAUDE.md, TASK_TEMPLATE.md.
  30 protocols were header-only bumps; 3 substantive (additive) changes:
  code-quality.md gains a "Right-sized & Resilient" section (lightweight + robust,
  scaled to Project Stakes, never below the safety floor); model-tiering.md gains
  "Surfacing Light-tier use to the user (opt-in)" + activation step 2b;
  testing-strategy.md gains "Fast feedback vs the gate" (focused subset while
  iterating, full suite at DoD/CI).
- AGENTS.md splice: Part 1 + preamble taken from upstream (header bump + the two
  matching standing-rule one-liners for code-quality and model-tiering); Part 2
  preserved verbatim. One NEW Part 2 field reconciled in: Model Tiers →
  "Tier-use reporting". Project has a real Light tier (haiku), so it is a live
  setup field — asked the user once; user chose ON → recorded
  "on (decided 2026-06-18)" (note Light-tier use in each work summary; tier use
  is logged in DECISION_LOG either way). No Part 2 values dropped; no new section
  left NOT-SET.
- Config files (diff-and-confirm): all preserved as deliberate project
  customizations / EOL-only — .claude/settings.json (project's pack-update
  SessionStart hook), opencode.json + .codex/config.toml (EOL-only), the
  customized .github/workflows/agent-ci.yml (scoped prod-dep audit + Cloudflare
  deploy job — upstream baseline would REGRESS it), .gitignore (project's
  Vite/PWA entries). dependabot.yml identical. Only .gitattributes changed:
  applied upstream's one-word comment clarification (no project customization to
  lose, behavior identical — active rule *.sh text eol=lf unchanged).
- Self-checks: all 36 pack headers = v12.19; Protocol Index ↔ protocols/ match
  both directions; no project-owned file (DECISION_LOG/HANDOFF/BACKLOG/RUNBOOK/
  README/src/tests) in the diff. Independent fresh-context splice review: CLEAN,
  zero blockers (Part 2 byte-identical to the pre-splice backup except the one
  added Tier-use reporting line).
- Behavior change to honor going forward: Tier-use reporting is ON — when any
  sub-task runs on the Light tier (haiku) during a turn, append a one-line note
  to that turn's work summary (count + tasks); silent on turns with none.
- State: committed on branch pack-upgrade/v12.19. NOT merged to main — per
  upgrade.md the user reviews the full diff and merges when ready.

## [2026-06-19] Backlog #27: Refill runway — Claude Code
- Goal: record a count on hand per item and show "≈N days left", projected from
  the schedule. Confirmed forks (asked): project-from-schedule (not per-intake);
  optional units-per-dose (default 1); refill reminder DEFERRED to a follow-up;
  display on Stack. Two additions folded in mid-build at the user's request:
  a settable "as of" date, and showing days-left on the Today card too.
- Data model: 3 new OPTIONAL, NON-INDEXED fields on StackItem — quantityOnHand,
  quantityAsOf ('YYYY-MM-DD' anchor), unitsPerDose. NO schema version bump / no
  migration (Dexie stores non-indexed fields freely); they ride export/import/
  merge/sync automatically because items already does (verified: whole-row copy,
  no field allowlist; payloadOf strips only id/uid/itemId/metricId).
- Projection (pure lib/runway.ts): consumption/due-day = times.length ×
  (unitsPerDose ?? 1); walk forward from quantityAsOf via the existing
  schedule.isDueOn, depleting on due days until stock can't cover the next dose
  → run-out date; daysLeft = daysBetween(today, runOut), ≤0 ⇒ "Refill now".
  MAX_HORIZON_DAYS=3650 bounds the loop (sparse schedules / future anchors).
  Null when no count/anchor or rate 0 → label hidden.
- "As of" date (the edge cases the user raised — mid-bottle, mid-subscription):
  the count is "how many right now", anchored to quantityAsOf. Default today;
  user may back-date to a past refill ("28 as of 2 weeks ago → ~14 left now").
  Form supplies it (date input, max=today, round-trips existing in edit mode);
  repository defaults to today only when a count exists with no date, clears it
  when the count is removed. normalizeInput stays pure (returns the date or
  undefined); add/update apply the today fallback.
- Graph-marker decision: inventory fields (quantity/asOf/unitsPerDose) are NOT a
  stack change — like intakes they persist but record NO StackEvent/marker.
  updateItem reworked so an inventory-only edit saves WITHOUT a marker (the old
  buildChangeSummary===null early-return would have dropped it), while a real
  field change still records its event. inventoryChanged also watches quantityAsOf.
- UI: ItemForm gains a "Refill tracking (optional)" fieldset (quantity / as-of /
  units). StackScreen + TodayScreen show "≈N days left" under the item (Today
  relative to the viewed selectedDate); ≤7 days or "Refill now" renders red+bold.
- Security self-check (input + stored data): numeric inputs validated at the
  boundary (quantity ≥0 finite; units floored ≥2 else default; asOf must match
  /^\d{4}-\d{2}-\d{2}$/); runway label is computed, not user text; React escapes;
  no secrets; rides E2E sync as plain fields. PASS.
- Tests: runway.test.ts (10 — each schedule kind, units-per-dose, elapsed days,
  back-dated subscription, refill/singular labels, not-tracked/zero-rate);
  stackRepository (+7 — stamping, units collapse, inventory-only no-marker,
  marker-with-real-change, clear-anchor, preserve past anchor, back-date no-marker);
  stackScreen render. Full suite 232 green (was 217 pre-#27 baseline 214→+18).
- Review: two independent fresh-context reviews (core, then the as-of/Today
  delta) — both CLEAN, ZERO blockers. NITs (DRY daysBetween, inclusive loop
  bound, per-row recompute) acknowledged, left as-is per scope + the v12.19
  "appropriate efficiency, not premature optimization" guidance.
- Also queued backlog #36 (multi-ingredient items) per user (commit 74f5511).
- Lint/format/typecheck/build all pass. Out of scope: auto refill reminder,
  barcode pack-size pre-fill (#31), decrement-on-intake.
- State: committed on branch feature/refill-runway. NOT merged — awaiting user
  demo confirmation + merge decision. Backlog #27 done pending merge.
  [Later merged to main 9845c84 + pushed; branch deleted.]

## [2026-06-19] Backlog #37: Today sorting + collapsible meds/supps section — Claude Code
- Goal: collapse the Today meds/supps checklist, and sort cards WITHIN each time
  section. Small, single-layer, low-risk brief (stated + proceeded). Custom
  drag-sort is the separate #38; not here.
- Collapse: wrapped the time-section list in the existing CollapsibleSection
  (title "Medications & supplements", storageKey "checklist", default open,
  localStorage-remembered like the #19 sections). The progress line stays ABOVE
  the collapsible, so collapsed = a glanceable "3 of 8 taken". (.today-section is
  just margin, not a card, so nesting is clean.)
- Sort: new TodaySortMode ('name' | 'nameDesc' | 'added') + TODAY_SORT_LABELS +
  a sortMode param on buildTimeSections (pure, lib/todayView.ts) ordering entries
  WITHIN each section; time-of-day grouping unchanged. 'added' = newest createdAt
  first (ISO string compare), name tiebreak. Default 'name' = byte-identical to
  the prior A→Z behavior. A <select> (shown only when >1 slot) persists the choice
  to localStorage (stacktrack.todaySortMode) — mirrors StackScreen's sort pattern
  exactly (same key/read-validate/onChange shape).
- Files: lib/todayView.ts, screens/TodayScreen.tsx (mostly prettier re-indent from
  the wrap), index.css (.today-sort spacing), tests. UI-only — no schema/sync/db
  change; sort+collapse are localStorage prefs, never synced.
- Security: N/A — pure UI/view; no input/auth/stored-data/secrets/external.
- Tests: todayView.test.ts +3 (A→Z default, Z→A, recently-added by createdAt);
  todayScreen.test.tsx +2 (collapse hides the section; sort control flips order
  A→Z→Z→A). Full suite 237 green (was 232).
- Review: independent fresh-context review — CLEAN, ZERO blockers. NITs
  (unguarded localStorage matching the existing StackScreen pattern; optional
  extra coverage) left as-is, out of scope.
- Lint/format/typecheck/build all pass.
- State: committed on branch feature/today-sort-collapse. NOT merged — awaiting
  user demo confirmation + merge decision. Backlog #37 done pending merge.

## [2026-06-22] Stack-change notes — reasoning on a change — Claude Code
- Brief (confirmed): let the user attach an optional free-text "why" note to a
  stack change, written/viewed from the "Stack changes in this period" list on
  the Graphs screen, persisted on the StackEvent. Ad-hoc user request (not a
  prior backlog item) — added as backlog #41, done pending merge.
- Design decision (asked the user): the Graphs list shows COLLAPSED rows
  (date+type+group merge, e.g. "Started Testosterone Support (2 items)"). Chose
  ONE SHARED NOTE PER ROW — the note writes to every underlying StackEvent in
  the row. WHY (user pick): matches the "a row = a change" mental model and
  needs no expand/collapse UI; merged rows are the less common case.
- Data model: new optional `note?: string` on StackEvent (db.ts). UNINDEXED, so
  NO Dexie schema-version bump (mirrors how StackItem.note was added). Confirmed
  by reading exportData/importData/mergeData/syncEngine that whole-row copy
  carries the field automatically — no change to the 4 sync libs, no
  schemaVersion fixture bump. (Matches the standing watch item: new FIELD on an
  existing table needs none of the new-TABLE plumbing.)
- Write path: setEventNote(eventIds, note) in stackRepository (the only writer).
  Trims; empty clears; writes the shared note to every id in the row; refreshes
  updatedAt so the edit propagates through merge/sync. Records NO new StackEvent
  and never touches the immutable snapshot fields (itemName/groups/summary) — a
  note edit is NOT a stack change (no graph marker), like intakes/inventory.
- View shaping: collapseEvents (graphView.ts) now carries `eventIds: number[]`
  and a shared `note?` on each ChangeMarker (first non-empty among the row's
  events; the trim guard is defensive against hand-edited import bundles).
- UI: new StackChangeNote.tsx — inline per-row editor mirroring JournalSection
  (local draft + "Saved" flash; live query is the single source of truth for
  the saved value). Each row in the Graphs change list gets Add/Edit note; the
  health-events list is untouched (kept on `.graph-change`; stack rows use a new
  `.graph-change-item` column wrapper so health events don't change).
- Security self-check (input + stored data): note is free text → stored trimmed
  via the repository → rendered by React in a <p>/textarea value (auto-escaped;
  no dangerouslySetInnerHTML, no markdown/HTML). No length cap (matches
  dayNote/itemNote). Rides the existing E2E-encrypted sync as a plain field; no
  new external transmission, no secrets, no auth/permissions change. PASS.
- Independent review (fresh-context subagent, Opus): ZERO blockers. Confirmed
  every invariant (no new event on edit; snapshots untouched; updatedAt bumped;
  export/merge/sync ride automatically; key stability; a11y via useId label).
  Acted on 2 IMPORTANT findings: (1) handleSave showed "Saved" even on a failed
  write of sensitive reasoning — added try/catch that keeps the editor open with
  the draft intact and shows an inline error; (2) double-tap could race two
  writes — added a `saving` guard + disabled Save during the write. NIT (note
  divergence after a cross-device merge — events in a row could hold different
  notes; editing then overwrites with the first non-empty) accepted as a KNOWN
  LIMITATION, documented here, not fixed: rare (needs merge + diverged notes +
  edit), deterministic, non-corrupting single-device (the dominant case);
  parallels the documented "deletions don't propagate in file sync" limitation.
- Tests: graphView.test.ts (+3: eventIds carried, shared note surfaced, note
  undefined when none); stackRepository.test.ts (+4: set/trim + updatedAt bump +
  no new event, shared across a collapsed row, clear on empty, ignore unknown
  id); exportData.test.ts (+1: note rides the bundle, schemaVersion stays 12);
  graphsScreen.test.tsx (+2: add-note flow end-to-end; save-failure keeps editor
  open + error, no "Saved"). Full suite 247 green (was 237).
- Lint/format/typecheck/build all pass. Tier use: review ran on Opus (judgment
  work — not downgraded); no Light-tier (haiku) sub-tasks this task.
- State: committed on branch feature/stack-change-notes. NOT merged — awaiting
  user demo confirmation + merge decision. Backlog #41 done pending merge.
- Follow-up (same task, user request): aligned the Add/Edit-note control + note
  text under the change TITLE — `.stack-change-note` margin-left 4rem → 5.125rem
  (dot 0.625 + gap 0.5 + date 3.5 + gap 0.5, matching the .graph-change columns).
  CSS-only; 247 tests still green; build/format pass.
  [Merged to main 7ee3a86 + pushed; feature branch deleted. CI/Pages deploy runs
  on push.]

## [2026-06-22] Freeze the top bar (sticky screen header) — Claude Code
- Brief (user request, UI polish — not a backlog item): freeze the top bar
  (title, subtitle/date, settings cog) so it stays visible while the page
  scrolls, like the fixed bottom navbar.
- Approach: `.screen-header` and `.today-header` → position:sticky top:0,
  z-index 15, opaque background (--color-bg), bottom divider. Chose sticky over
  fixed: sticky stays in flow, so no per-screen compensating padding-top and it
  adapts to the two header heights (Today's date-nav vs the others' subtitle).
- Follow-up (same request): the title scrolled flush to the very top before
  sticking because the 1rem gap lived on the .screen/.today scroll CONTAINER
  (above the sticky boundary). Moved that top padding INTO the headers'
  padding-top so the gap travels with the sticky box; shifted the absolute
  settings cog top 0 → 1rem to stay title-aligned (it pins to the header's
  padding box).
- Scope: CSS-only (src/index.css). All 6 screens covered (5 use .screen-header,
  Today uses .today-header). Divider is content-width (inset), matching the
  app's inset/card aesthetic — user confirmed inset is fine. No JS/logic/schema
  change; no security surface.
- Tests: 247 green (unchanged — no test asserts pixel layout, per the
  graphsScreen test's own note). Lint/typecheck/format/build pass.
- State: committed on branch fix/freeze-top-bar, merged to main cacbd2e + pushed,
  branch deleted. CI/Pages deploy runs on push.

## [2026-06-23] Backlog #38a: Custom drag-to-reorder (Stack screen) — Claude Code
- Brief (confirmed): add a "Custom" sort mode where the user drags item cards
  into an explicit order that persists and rides sync. Split #38 → #38a (Stack,
  this task) + #38b (Today within time sections, deferred). User picked Stack
  first + the dnd-kit library via AskUserQuestion.
- DEPENDENCY DECISION (default policy — adding a third-party dep — confirmed by
  user this task, recorded per Instruction Precedence): added @dnd-kit/core
  ^6.3.1 + @dnd-kit/sortable ^10.0.0 + @dnd-kit/utilities ^3.2.2. WHY: HTML5
  drag doesn't work on touch (the installed PWA's primary surface); hand-rolling
  pointer-based touch DnD well is far more fragile. dnd-kit is touch + keyboard
  accessible. Peer dep react>=16.8 covers the project's React 19. Dependency
  audit: dnd-kit added 4 clean packages, 0 new vulns; the 5 pre-existing audit
  findings are dev-tooling only (esbuild/Vite, undici+ws via miniflare/wrangler)
  — not shipped, out of scope, left as-is.
- Persistence model: a single unindexed `order?: number` per StackItem. WHY:
  lightest path that rides sync — unindexed ⇒ NO schema-version bump, rides
  export/import/merge/sync via the existing whole-row copy, ZERO changes to the
  4 sync libs (confirmed by review). reorderItems(orderedIds) in stackRepository
  (the only writer) writes a dense rank 0..n-1 in one transaction, skips items
  already at rank (minimal sync deltas), bumps updatedAt. Reordering is NOT a
  stack change — records no StackEvent/graph marker (like intakes/inventory).
- Sort: sortByCustomOrder + 'custom' StackSortMode (lib/stackView). Ranked first
  by order; unranked (undefined — new or unarchived items) to the END by name.
  Compares ranks directly (not subtraction) to dodge Infinity−Infinity=NaN.
- Merge: order is per-item → converges via existing newest-wins-by-uid (fine for
  single-user; simultaneous cross-device reorders rare, deterministic).
- UI: StackScreen renderActiveItem split into renderActiveItem (<li>) +
  renderItemBody (inner, reused). Custom mode renders SortableStackList
  (dnd-kit DndContext + SortableContext; PointerSensor 5px activation +
  KeyboardSensor) of SortableStackItem rows (useSortable; dedicated ⠿ drag
  handle carries the listeners + setActivatorNodeRef; touch-action:none on the
  handle so the page still scrolls and Edit/Archive stay tappable). A hint line
  prompts discovery. Drag only in Custom; other sorts read-only.
- Security self-check: N/A new surface — reorder writes a computed integer rank
  via the repository; no user free-text, no auth/secrets/external. Rides E2E
  sync as a plain field. PASS.
- Independent review (fresh-context subagent, Opus): ZERO blockers. Confirmed
  export/merge/sync ride, no StackEvent on reorder, updatedAt bumped, touch-action
  scoping, React 19 compat, new items fall to end. Acted on 2 IMPORTANT: (1)
  added setActivatorNodeRef on the handle (keyboard-drag focus correctness); (2)
  unarchiveItem now clears `order` so a restored item re-enters UNRANKED instead
  of keeping a stale rank that could collide with a since-reordered list (+ test;
  confirms Dexie update drops an undefined-valued unindexed key). NIT (redundant
  role="button" from spreading dnd-kit attributes onto a native <button>) left
  per the reviewer's own guidance — cosmetic, harmless.
- Tests (+11; full suite 257 green, was 247): stackView (3 — rank order,
  unranked-to-end, all-unranked stable/no NaN); stackRepository (5 — dense rank
  + updatedAt, no StackEvent, skip-unchanged, ignore unknown id, unarchive
  clears order); exportData (1 — order rides bundle, schemaVersion stays 12);
  stackScreen (1 — Custom renders draggable rows in saved order + hint + persists
  the pref). Real pointer drag isn't simulated in jsdom (verified via demo).
- Lint/typecheck/format/build pass. Bundle precache 726→772 KiB (dnd-kit ~45KiB).
- State: committed on branch feature/custom-sort-stack. Backlog #38 → #38a done
  pending merge; #38b (Today reorder) added as planned.
