<!-- Starter Pack v12.16 — protocols/cross-cutting.md -->
<!-- Load this file when: task touches 3+ files, crosses more than one architectural layer, or involves rename/move/structural reorganization -->
<!-- Does NOT trigger when: changes are purely mechanical in a single layer
     (e.g., a docs-only update across 3 files, a pure rename in one module
     with no logic changes), or when all affected files are trivially related
     and no coordination risk exists across layers. -->
<!-- Do not load unless triggered — see AGENTS.md → Protocol Index -->

## Cross-Cutting Changes & Pre-Flight Plans

A task may legitimately span many files — a rename, a new feature that touches
every layer, a cross-cutting refactor. Size does not disqualify a task from
being a single logical change. What matters is that scope is agreed upfront.

### Pressure-test the requirement first

This plan is about *mechanics* — which files, in what order. If the brief itself
is ambiguous or risky (not just large), pressure-test *what is wanted* before
planning *how*: run the Requirement Pressure-Test (protocols/requirements.md,
SCOPE & ACCEPTANCE lens) to nail scope edges, acceptance criteria, and failure
modes, then produce the pre-flight plan below. Requirement first, file-mechanics
second. A large-but-crisp task (clear scope, no ambiguity) skips straight to the
plan.

### When a pre-flight plan is required

A pre-flight plan is required whenever a task will:
- Touch 3 or more files, OR
- Cross more than one architectural layer, OR
- Involve any rename, move, or structural reorganization

### Pre-flight plan format

Before touching any file, the agent produces:

```
## Pre-flight Plan — [task name]

Files to be modified:
- `[path/to/file.ext]` — [what changes and why]
- `[path/to/file.ext]` — [what changes and why]

Files to be created:
- `[path/to/file.ext]` — [what it is and why it's needed]

Files to be deleted:
- `[path/to/file.ext]` — [why it's being removed]

Order of changes:
1. [First change — why this order]
2. [Second change]

Rollback plan:
- [How to undo this if something goes wrong]

Files NOT being touched (confirming scope boundary):
- [Related file that might seem relevant but is out of scope]

Estimated risk: [Low / Medium / High] — [brief reason]
```

The user must confirm the pre-flight plan before the agent touches anything.
If the plan changes during execution — a file that wasn't listed needs to be
touched — the agent stops, updates the plan, and re-confirms before continuing.

---


---
