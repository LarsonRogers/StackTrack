<!-- Starter Pack v12.19 — protocols/session-start.md -->
<!-- Load this file when: the AGENTS.md Session Start router has determined the
     session type and you need the detailed checklist — First Session (type B)
     or Session Resumption (type A). -->
<!-- Does NOT trigger when: the first message is a read-only/meta-review request
     (load protocols/read-only.md), or the session type is C/D (load
     inherited-codebase.md / refactor.md). The router itself, the read order,
     the meta-review preemption, and the version check stay in AGENTS.md. -->
<!-- Do not load unless triggered — see AGENTS.md → Protocol Index -->

## Session Start — detailed checklists

AGENTS.md → Session Start holds the always-on parts (read order, meta-review
preemption, session-type router, version check). This file holds the two
detailed checklists the router points to.

### First Session Protocol (no log, no non-pack files — session type B)

```
[ ] 1. Read AGENTS.md in full (you are doing that now)
[ ] 1b. If the folder is not a git repository (`git status` fails), run
        `git init` — this is the agent's job, never the user's — and note
        it in the first log entry
[ ] 2. Scan the repo structure (read only, 3 levels deep; exclude
        node_modules/, vendor/, dist/, build/, out/, .git/, __pycache__/,
        .venv/, venv/, coverage/, .cache/; note >1MB files, do not read them)
[ ] 3. Identify entry points, existing patterns, any code already present
[ ] 4. Detect the audience (one question, second only if ambiguous — script
        in protocols/communication.md) and write the result to
        Part 2 → Audience Mode
[ ] 4b. If the project is an idea rather than a codebase — empty or
        near-empty folder, or the user cannot answer stack questions —
        run protocols/product-definition.md (product brief → recommended
        stack → seeded BACKLOG.md) before continuing. Never assume a stack
        is inferable from an idea.
[ ] 5. Run the Placeholder Inference Protocol (protocols/placeholder-inference.md)
        — infer, present, confirm, then write Part 2. The user never edits
        pack files manually. (Skip values already set by product definition.)
[ ] 6. Report findings: what exists, what is wired up, what appears incomplete
[ ] 7. Create DECISION_LOG.md (first entry) and HANDOFF.md
        (formats: protocols/log-format.md)
[ ] 8. Ask the developer to confirm the task before writing any code
```

### Session Resumption Protocol (log exists — session type A)

```
[ ] 1. Read AGENTS.md — Part 2 → Audience Mode is the active communication
        mode; apply it from your first reply. If it reads [NOT SET], detect
        it (protocols/communication.md) and write it before proceeding.
[ ] 2. Read HANDOFF.md — last task, confirmed next task, open watch items.
        Missing but DECISION_LOG.md exists → regenerate it from the log tail
        (protocols/log-format.md). Then read DECISION_LOG.md from the bottom
        only as far as needed.
[ ] 3. Run the pack version consistency check (AGENTS.md → Session Start →
        Pack version consistency check)
[ ] 4. Load protocols triggered by session context (AGENTS.md → Protocol Index).
        Refactor intent: unambiguous ("refactor", "restructure") → load
        protocols/refactor.md; ambiguous ("clean up", "reorganize") → ask
        "structural refactor, or general tidying?" before loading.
[ ] 5. Report unprompted: (a) where we left off, (b) current codebase state,
        (c) open watch items, (d) proposed next step
[ ] 6. Wait for developer confirmation before touching anything
```

This report answers "where did we leave off?" — delivered automatically so
the developer never has to ask.
