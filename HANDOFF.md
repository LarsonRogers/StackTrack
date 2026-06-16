# Handoff — StackTrack
<!-- Overwritten by the agent after every committed task. -->

**As of:** 2026-06-16 · **Pack version:** v12.0 · **Audience mode:** Technical non-dev
**Last completed:** Events feature **Part 1** (data + repository + Today UI +
export/import/merge/sync registration). New `healthEvents` table (additive
schema v9), `healthEventRepository`, `EventsSection` on Today, `lib/events.ts`.
Committed LOCAL ONLY. 154 tests green; lint/format/typecheck/build pass.
**Confirmed next task:** Events **Part 2** — show events as markers on the
metric graphs. Then Part 3 (collapsible Today sections), Part 4 (backlog/docs).
Full plan: `C:/Users/larso/.claude/plans/abstract-wondering-beacon.md`.

  Part 2 — `graphView.ts`: add `EVENT_CATEGORY_COLORS` (distinct from the
  green/amber/red stack `EVENT_COLORS`) + `buildEventMarkers(events, startDate)`
  → lightweight `EventMarker` shape. `GraphsScreen.tsx`: read
  `db.healthEvents.toArray()`, render event markers as `<ReferenceLine>` with a
  distinct dash (stack uses "5 3"), add a "Health events in this period" legend
  list. Reuse `CATEGORY_LABELS` from `lib/events.ts`. Tests: `graphView.test.ts`.
  Part 3 — new `CollapsibleSection.tsx` (title + storageKey; persist open/closed
  in localStorage `stacktrack:section:<key>`); wrap the major Today sections.
  Part 4 — BACKLOG: Events, Collapsible sections, + future **push reminders**
  (Cloudflare Cron + web-push + subscription endpoint + custom SW; iOS
  Home-Screen-only) and **Apple Health via native Capacitor wrapper** (no web
  API; needs App Store + Mac/Xcode).

**Wave plan:** W1–W3 ✅ shipped+live. Now: Events feature (Parts 1✅/2/3/4),
all LOCAL ONLY until the user okays a push.

**Open watch items:**
- Events Parts are committed LOCAL ONLY; nothing pushed since `5b49625`
  (Wave 3 shipped/live). Push the Events work only on user go-ahead.
- Schema is now v9 (additive new `healthEvents` table; no migration). Invariant
  kept: raw user data only, NO medical interpretation (categories organize only).
- A Vite dev server may need restarting for the demo (`npm run dev`, :5173).
- Demo gate OPEN for the Events feature (show on Today + graphs before push).
- Also open: item 12 (cross-device merge demo), 13e (two-device sync demo).
- `.github/workflows/agent-ci.yml` placeholder jobs fail by design.
- Live app: https://stacktrack-ea9.pages.dev · Sync server: /health → ok.

**Resume prompt (paste into any agent):**
    Read AGENTS.md, then HANDOFF.md, then the last entries of
    DECISION_LOG.md as needed. Run the Session Resumption Protocol and
    report status before proceeding.
