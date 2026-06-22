# Handoff — StackTrack
<!-- Overwritten by the agent after every committed task. -->

**As of:** 2026-06-22 · **Pack version:** v12.19 · **Audience mode:** Technical non-dev
**Last completed:** **Frozen top bar** (UI polish, not a backlog item) — the
screen header (title, subtitle/date, date-nav, settings cog) is now
**position:sticky** so it stays visible while the page scrolls, like the fixed
bottom navbar. The 1rem gap above the title lives on the header's own
`padding-top` (not the scroll container) so the breathing room is kept when the
header sticks; the absolute cog shifted `top: 1rem` to stay title-aligned.
CSS-only (`src/index.css`); covers all 6 screens (`.screen-header` + Today's
`.today-header`). Divider is content-width (inset) — user OK'd inset.
**Just before that:** Backlog **#41 — Stack-change notes** (attach a "why" note
to a stack change from the Graphs change list; new unindexed `StackEvent.note`,
no schema bump; rides export/sync). See the prior log entries.
**247 tests green**; lint/typecheck/format/build pass.

**MERGED to `main` (cacbd2e) and PUSHED** — CI (lint/tests) + Cloudflare Pages
auto-deploy run on the push. Branches deleted. Confirm CI is green and the live
app updated; if CI fails, investigate before further work.

**Up next (BACKLOG.md):** #38 custom drag-sort (persisted order + touch DnD,
needs a dep like dnd-kit), #28 adherence, #29 correlation, #30 consent framework
(gates off-device #31/#32/#33 + therapy-app #39), #34 attachments,
#36 multi-ingredient, #40 auto refill reminder. #35 affiliate = parked.

**Recent context (memory + last sessions):**
- #41 design pick (yours): a Graphs row = one change → ONE SHARED note per row;
  a merged row writes the note to all its events. Most rows are solo.
- The user is building a SEPARATE companion therapy-aid app that will consume
  StackTrack data (BACKLOG #39); keep the JSON export schema STABLE + versioned.
  Off-device features are opt-in/default-off (#30); interactions are link-out only.

**Open watch items:**
- **#41 known limitation (logged, not fixed):** after a cross-device merge, two
  events in one collapsed row can hold DIFFERENT notes (merge resolves per-uid).
  The row shows the first non-empty; editing then overwrites all with that one.
  Rare + non-corrupting single-device; revisit only if it bites. Like the
  documented "file-sync deletions don't propagate" limitation.
- New DB *table* → extend export/import/merge/sync (4 libs) + fixtures + bump
  export-test schemaVersion. New *fields* on an existing table need none of that
  (#41 confirmed this end-to-end).
- Tier-use reporting is ON (v12.19): note Light-tier (haiku) sub-task use in the
  work summary; silent when none ran. (#41 used only an Opus review sub-agent.)
- Windows autocrlf: `prettier --write` rewrites EOL on untouched files; format
  only the files you touched to keep commits scoped (blobs are LF, CI passes).
- A dev server is running on :5173 — stop it when done.
- Pre-existing: items 12 + 13e sync demo gates open.
- Live app: https://stacktrack-ea9.pages.dev · Sync server: /health → ok.

**Resume prompt (paste into any agent):**
    Read AGENTS.md, then HANDOFF.md, then the last entries of
    DECISION_LOG.md as needed. Run the Session Resumption Protocol and
    report status before proceeding.
