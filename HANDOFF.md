# Handoff — StackTrack
<!-- Overwritten by the agent after every committed task. -->

**As of:** 2026-06-19 · **Pack version:** v12.19 · **Audience mode:** Technical non-dev
**Last completed:** Backlog **#37 — Today sorting + collapsible meds/supps
section**. The Today checklist is now wrapped in a CollapsibleSection
("Medications & supplements", remembered in localStorage), and a sort `<select>`
(Name A→Z / Z→A / Recently added) orders cards WITHIN each time section
(time-of-day grouping unchanged). Pure logic in `lib/todayView.ts`
(`buildTimeSections` sortMode param). UI-only — no schema/sync/db change.
**237 tests green**; lint/format/typecheck/build pass; independent review
**zero blockers**.

**On branch `feature/today-sort-collapse`, committed but NOT merged** — awaiting
your merge decision. Dev server at http://localhost:5173 has it live via HMR.

**To finish:** verify (collapse the section; switch the sort and watch cards
reorder within a time block), then merge:
`git checkout main && git merge --no-ff feature/today-sort-collapse`. Nothing
pushed yet.

**Up next (BACKLOG.md):** #38 custom drag-sort (the manual-reorder companion to
#37 — needs a persisted order + touch DnD), #28 adherence, #29 correlation,
#30 consent framework (gates off-device #31/#32/#33 + therapy-app #39),
#34 attachments, #36 multi-ingredient, #40 auto refill reminder. #35 affiliate = parked.

**Recent context (memory + last sessions):**
- Refill runway (#27) shipped: optional count + "as of" date + units-per-dose →
  days-left on Stack AND Today. Inventory edits record NO graph marker.
- The user is building a SEPARATE companion therapy-aid app that will consume
  StackTrack data (BACKLOG #39); keep the JSON export schema STABLE + versioned.
  Off-device features are opt-in/default-off (#30); interactions are link-out only.
  (Saved to project memory.)

**Open watch items:**
- New DB *table* → extend export/import/merge/sync (4 libs) + fixtures + bump
  export-test schemaVersion. New *fields* on an existing table need none of that.
- Tier-use reporting is ON (v12.19): note Light-tier (haiku) sub-task use in the
  work summary; silent when none ran. (This task used only Opus sub-agents.)
- Windows autocrlf: `prettier --write` rewrites EOL on untouched files; revert
  EOL-only ones to keep commits scoped (blobs are LF, CI passes).
- A dev server may be running on :5173 — stop it when done.
- Pre-existing: items 12 + 13e sync demo gates open.
- Live app: https://stacktrack-ea9.pages.dev · Sync server: /health → ok.

**Resume prompt (paste into any agent):**
    Read AGENTS.md, then HANDOFF.md, then the last entries of
    DECISION_LOG.md as needed. Run the Session Resumption Protocol and
    report status before proceeding.
