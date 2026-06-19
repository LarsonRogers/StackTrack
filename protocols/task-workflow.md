<!-- Starter Pack v12.19 — protocols/task-workflow.md -->
<!-- Load this file when: starting a coding task and you need the full Pre-Edit
     checklist, or the checkpoint/rollback procedure. -->
<!-- Does NOT trigger when: the session is read-only/meta-review (no edits), or
     for a non-coding conversational turn. The always-on parts (task brief must
     exist, Scope Control, Cross-Cutting trigger, Definition of Done) stay in
     AGENTS.md → Task Workflow. -->
<!-- Do not load unless triggered — see AGENTS.md → Protocol Index -->

## Task Workflow — Pre-Edit and Checkpoint detail

AGENTS.md → Task Workflow holds the always-on parts (an approved brief is
required, Scope Control, the Cross-Cutting trigger, and the Definition of
Done). This file holds the step-by-step procedures those rules invoke. The
task-brief reformulation procedure itself lives in TASK_TEMPLATE.md.

### Pre-Edit Protocol (before every coding task)

```
[ ] 0. Confirm an approved task brief exists — do not proceed without one
[ ] 1. Read HANDOFF.md — orient to where the last session ended
[ ] 2. List all files relevant to the task (read only)
[ ] 3. Identify existing patterns in those files (naming, structure, data flow)
[ ] 4. Identify where the relevant logic currently lives
[ ] 5. State the exact scope of the planned change (files, functions)
[ ] 6. Confirm no existing pattern already solves the problem (Part 2 → Pattern Registry)
[ ] 6b. Confirm the change respects the architecture sketch and Key
        Invariants (Part 2). A change that would cross a boundary is a
        growth-trigger decision (logged), never a silent violation.
[ ] 7. Identify external systems/SDKs/APIs involved — if any, complete the
        External Research Protocol first (protocols/external-research.md)
[ ] 8. Confirm git working tree is clean (git status)
```

### Checkpoint / Rollback

```bash
# Before any task:        git status (clean) + git log --oneline -5
# After each task:        1. tests pass  2. append DECISION_LOG.md entry
#                         3. overwrite HANDOFF.md  4. git add -A && commit
# If something breaks:    git reset --hard HEAD
```

If any Definition of Done item fails (AGENTS.md → Task Workflow), roll back —
do not accumulate broken state across tasks.
