# Handoff — StackTrack
<!-- Overwritten by the agent after every committed task. -->

**As of:** 2026-06-23 · **Pack version:** v12.19 · **Audience mode:** Technical non-dev
**Last completed:** Backlog **#38a — Custom drag-to-reorder (Stack screen)**. The
Stack screen's "Sort by" menu has a new **Custom** option: drag a card's ⠿ handle
to set your own order, which persists and rides sync. Order is stored as an
unindexed `StackItem.order` (dense rank) — **no schema-version bump**; rides
export/import/merge/sync as a plain field. Drag is **dnd-kit** (touch + keyboard;
`touch-action:none` only on the handle so the page still scrolls and Edit/Archive
stay tappable). New + unarchived items enter **unranked** → fall to the end.
Today-screen reorder is the deferred follow-up **#38b**.
**257 tests green**; lint/typecheck/format/build pass; independent review
**zero blockers** (acted on 2 IMPORTANT — `setActivatorNodeRef`, unarchive clears
stale order).

**MERGED to `main` and PUSHED** — CI (lint/tests) + Cloudflare Pages auto-deploy
run on the push. Branch deleted. Confirm CI green + live app updated; if CI
fails, investigate before further work.

**New dependency this task:** @dnd-kit/core ^6.3.1 + @dnd-kit/sortable ^10.0.0 +
@dnd-kit/utilities ^3.2.2 (user-confirmed; decision logged). Lockfile committed.

**Up next (BACKLOG.md):** #38b Today custom reorder (reuses dnd-kit + the `order`
field; open Q: one global order vs per-time-section), #28 adherence, #29
correlation, #30 consent framework (gates off-device #31/#32/#33 + therapy #39),
#34 attachments, #36 multi-ingredient, #40 auto refill reminder. #35 = parked.

**Open watch items:**
- **#38a model:** per-item `order` rank can go sparse/duplicate (archive, merge);
  the comparator (compare ranks directly + name tiebreak; unranked→Infinity→end)
  absorbs this into a stable total order. Don't "fix" sparsity by renumbering on
  every change — it's by design and would bloat sync deltas.
- **Pre-existing audit findings (5):** esbuild (Vite dev server), undici + ws (via
  miniflare/wrangler) — all DEV tooling, not shipped; predate #38a; `npm audit
  fix` deferred (would churn build tooling). dnd-kit itself added clean.
- New DB *table* → extend export/import/merge/sync (4 libs) + fixtures + bump
  export-test schemaVersion. New *fields* on an existing table need none of that.
- Tier-use reporting is ON: note Light-tier (haiku) sub-task use in the work
  summary; silent when none ran. (#38a used only an Opus review sub-agent.)
- Windows autocrlf: `prettier --write` rewrites EOL on untouched files; format
  only the files you touched to keep commits scoped (blobs are LF, CI passes).
- A dev server may be running on :5173 — stop it when done.
- Pre-existing: items 12 + 13e sync demo gates open.
- Live app: https://stacktrack-ea9.pages.dev · Sync server: /health → ok.

**Resume prompt (paste into any agent):**
    Read AGENTS.md, then HANDOFF.md, then the last entries of
    DECISION_LOG.md as needed. Run the Session Resumption Protocol and
    report status before proceeding.
