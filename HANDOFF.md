# Handoff — StackTrack
<!-- Overwritten by the agent after every committed task. -->

**As of:** 2026-06-22 · **Pack version:** v12.19 · **Audience mode:** Technical non-dev
**Last completed:** Backlog **#41 — Stack-change notes**. You can now attach an
optional free-text "why" note to a stack change from the **Graphs** screen's
"Stack changes in this period" list — each row has an **Add note / Edit note**
control. The note records your reasoning for starting/changing/stopping
something and shows on the row under the change. Stored on the `StackEvent`
(new unindexed `note?` field — **no schema-version bump**); a collapsed
multi-change row (e.g. "Started Testosterone Support (2 items)") shares one note
across its underlying events. UI-only data: rides export/import/merge/sync as a
plain field with no change to the 4 sync libs.
**247 tests green**; lint/format/typecheck/build pass; independent review
**zero blockers** (acted on 2 IMPORTANT findings — see below).

**On branch `feature/stack-change-notes`, committed but NOT merged** — awaiting
your merge decision. Dev server at http://localhost:5173 has it live via HMR.

**To finish — demo, then merge:**
1. Open Graphs, pick a metric that has a logged value (so the chart renders),
   make sure there's at least one stack change in the range.
2. On a row under "Stack changes in this period", click **Add note**, type a
   reason (e.g. "after bloodwork"), **Save note** → the note appears on the row
   and the button becomes **Edit note**. Re-open the app / another device after
   sync to confirm it persisted.
3. Merge: `git checkout main && git merge --no-ff feature/stack-change-notes`.
   Nothing pushed yet.

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
