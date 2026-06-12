<!-- Starter Pack v12.0 — protocols/placeholder-inference.md -->
<!-- Load this file when: first session on any project type — fills REQUIRED placeholders -->
<!-- Does NOT trigger when: a read-only meta-review is active (placeholder inference
     stays suspended until the review is complete and normal session-start resumes). -->
<!-- Do not load unless triggered — see AGENTS.md → Protocol Index -->

### Placeholder Inference Protocol

The user never manually edits starter pack files. All placeholder substitution
is handled by the agent on first session.

Every bracketed placeholder in AGENTS.md → Part 2 belongs to exactly one
bucket below. An unclassified placeholder is a pack bug — flag it when
auditing, never improvise a category at runtime.

**Required placeholders** — the agent must resolve all of these before any
coding task begins:
```
[PROJECT_NAME] / Project Summary — infer from repo name, existing README,
                        or package.json/pyproject.toml; for idea-stage
                        projects, set by the product-definition protocol
[Quick Constraints]   — language/runtime, files not to edit, lint + test
                        commands (one-line versions of the sections below)
[Tech Stack table]    — infer from files present: package.json,
                        requirements.txt, Cargo.toml, go.mod, etc.; for
                        idea-stage projects, set by product definition
[Validation Commands] — infer from package.json scripts, Makefile, or common
                        conventions for the detected stack. If genuinely
                        unavailable, mark with: # NOT CONFIGURED
[File Structure]      — infer from actual repo layout
```

**Deferred placeholders** — intentional scaffolding filled as the project
develops. The agent never halts on these:
```
[Code Style]          — default: the chosen stack's standard conventions;
                        record only deviations, as they are decided
[Task Prompts]        — seeded by the product-definition protocol (BACKLOG.md)
                        or by the developer as work is planned
[Related Docs & Projects] — filled if/when relevant
[Pattern Name]        — Pattern Registry entries, filled as patterns emerge
                        (bounded, cap 40 lines)
[Key Invariants] / Project-Specific Architecture — filled as architecture
                        solidifies (bounded, cap 60 lines)
```

**Set by other protocols — NOT resolved by inference (do not ask for these):**
```
Audience Mode         — set by audience detection at session start
                        (protocols/communication.md)
BACKLOG.md contents   — set by the product-definition protocol
```

**The inference flow:**
```
[ ] 1. Scan AGENTS.md → Part 2 for [BRACKETED] placeholders
[ ] 2. Categorize each as Required, Deferred, or set-by-other-protocol
        (see above) — every placeholder must land in exactly one bucket
[ ] 3. For each Required placeholder, infer the most likely value from
        the repo contents, file names, and any existing documentation
[ ] 4. Present inferred values to the user in a single confirmation block:

        "Here's what I've inferred for this project — confirm or edit
        any of these before I fill them in:"

        Project name:      [inferred value]
        Language/runtime:  [inferred value]
        Lint command:      [inferred value]
        Test command:      [inferred value]
        [etc.]

        Say "confirmed" to accept all, or tell me which to change.

[ ] 5. Write confirmed values into AGENTS.md → Part 2 (the only file that
        holds project specifics — CLAUDE.md is an import shim and is never
        written during inference)
[ ] 6. Note any Required placeholders that could not be inferred — ask
        the user directly for those only
[ ] 7. Proceed — do not halt on Deferred placeholders
```

The user's only responsibility is confirming or editing the presented values.
No manual file editing required.

---


---
