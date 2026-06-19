# Handoff — StackTrack
<!-- Overwritten by the agent after every committed task. -->

**As of:** 2026-06-19 · **Pack version:** v12.19 · **Audience mode:** Technical non-dev
**Last completed:** Backlog **#27 — Refill runway**. Record a count on hand per
item (+ optional "as of" date and units-per-dose) and see **"≈N days left"** on
the **Stack** and **Today** cards, projected from the schedule (pure
`lib/runway.ts`). 3 new optional non-indexed fields on StackItem (no schema bump,
no migration; ride export/sync automatically). Inventory edits persist WITHOUT a
graph marker (like intakes). **232 tests green**; lint/format/typecheck/build
pass; two independent reviews **zero blockers**.

**On branch `feature/refill-runway`, committed but NOT merged** — awaiting your
merge decision (the dev server at http://localhost:5173 has it live via HMR).
The branch also carries committed backlog item **#36 (multi-ingredient items)**
queued earlier this session (commit 74f5511).

**To finish:** verify on the dev server (Stack/Today show days-left; set a small
quantity → red "Refill now"; set an "as of" date in the past to record a refill),
then merge: `git checkout main && git merge --no-ff feature/refill-runway`.
Nothing pushed yet.

**Decisions baked into #27 (for the next agent):**
- Runway is PROJECTED from the schedule, not decremented per intake. The count
  is "how many right now", anchored to `quantityAsOf` (default today; user may
  back-date). Editing only inventory fields records NO StackEvent/graph marker.
- `unitsPerDose` default 1 (stored only when ≥2). Low cue = ≤7 days.

**Up next (from BACKLOG.md):** #27 was the chosen build. Remaining planned:
#28 adherence intelligence, #29 correlation insight, #30 consent framework
(gates the off-device #31 barcode / #32 interaction link-out / #33 visit export),
#34 attachments, #36 multi-ingredient items. #35 affiliate = parked. The auto
**refill reminder** is the natural #27 follow-up (deferred deliberately).

**Open watch items:**
- Adding any new DB *table*: extend export/import/merge/sync (4 libs) + fixtures
  + bump export-test schemaVersion. (New *fields* on an existing table — like
  #27 — need none of that; they ride the whole-row copy.)
- Tier-use reporting is ON (v12.19): note Light-tier (haiku) sub-task use in the
  work summary; silent when none ran. (This task used only Opus sub-agents.)
- Windows autocrlf: `prettier --write` rewrites EOL on untouched files; revert
  EOL-only ones to keep commits scoped (blobs are LF, CI passes).
- A dev server may still be running on :5173 — stop it when done.
- Pre-existing: items 12 + 13e sync demo gates open.
- Live app: https://stacktrack-ea9.pages.dev · Sync server: /health → ok.

**Resume prompt (paste into any agent):**
    Read AGENTS.md, then HANDOFF.md, then the last entries of
    DECISION_LOG.md as needed. Run the Session Resumption Protocol and
    report status before proceeding.
