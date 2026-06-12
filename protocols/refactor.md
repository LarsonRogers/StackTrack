<!-- Starter Pack v12.0 — protocols/refactor.md -->
<!-- Load this file when: explicit structural improvement goal with no new features -->
<!-- Does NOT trigger when: user intent includes any functional change, new feature,
     or behavior modification alongside structural work — that is an edit session
     with structural components, not a pure refactor. When intent is ambiguous,
     the protocol requires asking one clarifying question before proceeding. -->
<!-- Do not load unless triggered — see AGENTS.md → Protocol Index -->

## Refactor Protocol

A refactor session has one primary constraint that overrides everything else:
**do not break working behavior.** The goal is structural improvement, not
feature addition. The agent must treat behavioral equivalence as the definition
of success.

This is a distinct session type — not a normal task, not an inherited codebase
assessment. Structural improvement only — no new features, no behavior changes.
If the user says "refactor this" with no further context, ask one clarifying
question before proceeding:
  "Just to confirm — is this structural cleanup only (no new features or
   behavior changes), or are there functional improvements you also want?
   I'll run the full refactor protocol for structural work."
If the user's intent is clearly structural-only (e.g., "clean up the module
structure," "extract these services," "no new features"), proceed without asking.

### Phase 1 — Establish a working baseline (before any changes)

```
[ ] 1. Run all available tests — they must pass before anything is touched
        If tests fail before refactoring begins, stop and report:
        "Tests are already failing before I've made any changes. We need
        to fix these first, otherwise I can't tell if I've broken anything."
[ ] 2. If no tests exist, flag it clearly:
        "There are no automated tests. I can't verify behavioral equivalence
        after refactoring without a safety net. Options:
        1. I write basic tests first (recommended — separate task)
        2. We proceed carefully with manual verification checkpoints
        3. We note this as a known risk in the decision log and proceed"
        Wait for user decision before continuing.
[ ] 3. Record the baseline commit:
        git add -A
        git commit -m "Baseline: pre-refactor, all tests passing"
        Note this commit hash in the decision log — this is the rollback point
[ ] 4. Document current behavior: note what the code does, what inputs produce
        what outputs, any edge cases visible in tests or comments
```

### Phase 2 — Plan the refactor

```
[ ] 1. Identify the structural problems to address — be specific:
        "Function X does three things and should be split"
        "Module Y mixes data access and business logic"
        Not: "the code is messy"
[ ] 2. Define the target structure — what it should look like after
[ ] 3. Break into the smallest possible sequential steps — each step
        must leave the code in a working state
[ ] 4. Present the plan as a pre-flight plan (AGENTS.md →
        Cross-Cutting Changes) — confirm before starting
[ ] 5. Explicitly list what will NOT change:
        - Public interfaces / function signatures (unless agreed)
        - External behavior and outputs
        - Data formats going in and out
```

### Phase 3 — Execute incrementally

```
[ ] 1. One structural change at a time — commit after each
[ ] 2. After every change: run tests, confirm they still pass
[ ] 3. If tests fail after a change:
        - Do not proceed to the next step
        - Roll back the failing change: git reset --hard HEAD~1
        - Diagnose why it broke before trying again (three-strike rule applies)
[ ] 4. Never refactor and add features in the same step — if a
        feature opportunity is spotted, note it as a watch item and
        continue with structural changes only
[ ] 5. Commit messages during refactor follow this format:
        "Refactor: [what structural change was made]"
        e.g., "Refactor: extract validateUser from authController"
```

### Phase 4 — Verify behavioral equivalence

After all refactor steps are complete:

```
[ ] 1. Run the full test suite — all tests must pass
[ ] 2. Compare behavior against the baseline documentation from Phase 1
[ ] 3. If any behavior changed that wasn't intended, treat it as a bug
        introduced by the refactor and fix it before closing the task
[ ] 4. Record in the DECISION_LOG.md entry:
        - What was refactored and why
        - What structural changes were made
        - Confirmation that tests pass
        - Any behavioral edge cases that were clarified during the process
        - Any deferred improvements spotted but not acted on (Watch Items)
```

### Rollback to baseline

If the refactor goes sideways and cannot be cleanly resolved:

```bash
# Find the baseline commit hash (recorded in the decision log)
git log --oneline

# Roll back to known-good baseline
git reset --hard [baseline-commit-hash]

# Confirm you're back to green
# Run tests — they must pass
```

Never roll forward through a broken refactor. Always return to the
last known-good state and start the affected step again from scratch.

### Refactor scope rules

These are stricter than normal scope control:

- One structural concern per task brief — "extract service layer" is one task,
  "rename all variables" is a separate task, never combined
- No opportunistic fixes during refactor — if bugs are spotted, log them as
  Watch Items. Fix them in a separate session after the refactor is complete.
- No dependency updates during a refactor session — too many variables
- No style/formatting changes mixed with structural changes — they make
  diffs unreadable and obscure what actually changed

---
