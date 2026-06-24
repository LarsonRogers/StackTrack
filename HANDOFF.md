# Handoff — StackTrack
<!-- Overwritten by the agent after every committed task. -->

**As of:** 2026-06-23 · **Pack version:** v12.19 · **Audience mode:** Technical non-dev
**Last completed:** Backlog **#38b — Custom drag-to-reorder (Today checklist)**. The
Today screen's "Sort by" menu gains a **Custom (drag)** option: drag a card's ⠿
handle to hand-order cards **within each time-of-day section**. The open design
question (items appear in multiple sections) was resolved by the user as
**per-SECTION independent order** — reordering the morning block doesn't touch
the evening block, and Today's order is independent of the Stack screen's Custom
order. Stored as a new unindexed `StackItem.todayOrder` (a `time→rank` map) —
**no schema-version bump**; rides export/import/merge/sync as a plain field
(newest-per-item-uid wins on the whole map). Drag reuses #38a's dnd-kit
components (generalized with optional className props; **StackScreen untouched**).
New/unarchived items enter unranked → fall to the end of their section.
**268 tests green** (+11); lint/typecheck/format/build pass; bundle precache
**772 KiB unchanged** from #38a. Independent review **zero blockers**. FULL demo
shown on :5173 — **user approved**.

**Committed on `feature/custom-sort-today`; MERGING to `main` + PUSH** — CI
(lint/tests/security) + Cloudflare Pages auto-deploy run on the push. Confirm CI
green + live app updated; if CI fails, investigate before further work.

**No new dependencies** this task (dnd-kit already added in #38a).

**Up next (BACKLOG.md):** #28 adherence, #29 correlation, #30 consent framework
(gates off-device #31/#32/#33 + therapy #39), #34 attachments, #36
multi-ingredient, #40 auto refill reminder, #37 Today collapsible meds section +
within-section sort. #35 = parked.

**Open watch items:**
- **#38b model:** `todayOrder` is per-item, per-section. Cross-device edge case
  (Device A reorders 08:00, Device B reorders 20:00 on the SAME item) → last
  writer's whole map wins, silently dropping the other section's change for that
  item. Acceptable for single-user, consistent with how #38a's `order` merges.
  Don't "fix" by splitting the map per section into separate records — over-eng.
- **dnd-kit reorder duplication:** `reorderTodaySection` and `reorderItems`
  (stackRepository) are near-identical loops (differ only in the field written).
  Left as-is (a shared helper for 2 call sites = over-engineering); revisit only
  if a 3rd reorder surface appears.
- **TruffleHog false-fail pattern:** any Dependabot PR can show a red "Security
  scan" from the `BASE == HEAD` quirk — NOT a finding. Fix = `@dependabot rebase`.
- New DB *table* → extend export/import/merge/sync (4 libs) + fixtures + bump
  export-test schemaVersion. New *fields* on an existing table need none of that.
- Tier-use reporting is ON: note Light-tier (haiku) sub-task use in the work
  summary; silent when none ran. (#38b used only an Opus review sub-agent.)
- Windows autocrlf: `prettier --write` rewrites EOL on untouched files; format
  only the files you touched (use `--end-of-line auto` to find REAL issues amid
  the CRLF noise). Blobs are LF, CI passes.
- A dev server may be running on :5173 — stop it when done (stopped this task).
- Pre-existing: items 12 + 13e sync demo gates open.
- Live app: https://stacktrack-ea9.pages.dev · Sync server: /health → ok.

**Resume prompt (paste into any agent):**
    Read AGENTS.md, then HANDOFF.md, then the last entries of
    DECISION_LOG.md as needed. Run the Session Resumption Protocol and
    report status before proceeding.
