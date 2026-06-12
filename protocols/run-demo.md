<!-- Starter Pack v12.0 — protocols/run-demo.md -->
<!-- Load this file when: closing any coding task (the Definition of Done's
     "user has seen it run" gate), completing a backlog item, or whenever the
     way to run the app changes. -->
<!-- Does NOT trigger when: the session is read-only/analysis, or the task is
     docs-only with no runnable behavior. -->
<!-- Do not load unless triggered — see AGENTS.md → Protocol Index -->

## Run & Demo Protocol

Tests passing is invisible to a non-developer. The product exists for the
user only when they have **seen it run**. This protocol defines the demo
gate in the Definition of Done and the artifact that makes the app runnable
by a human without the agent present.

### RUNBOOK.md — the "how to run this" artifact

Created the first time the project becomes runnable (backlog item 1, the
walking skeleton) and kept current from then on. **Any change that alters
how the app is started, stopped, or seen must update RUNBOOK.md in the same
commit** — a stale runbook fails the gate exactly like a failing test.

```markdown
# How to run [project name]
<!-- Maintained by the agent. If these steps don't work, tell the agent:
     "the runbook is broken" — fixing it takes priority. -->

## Start it
1. [exact command or double-clickable step, one action per line]
2. [e.g., "open http://localhost:3000 in your browser"]

## You should see
[one sentence — what a successful start looks like]

## Stop it
[exact step, e.g., "press Ctrl+C in the terminal"]

## If it doesn't start
- [most likely problem, plain English, what to tell the agent]
```

Written for the recorded audience mode. Non-dev: every step literal, no
assumed knowledge. Developer: compact is fine.

### The demo gate ("user has seen it run")

The Definition of Done contains: `[ ] User has seen it run — per
protocols/run-demo.md`. How to satisfy it depends on the task:

**FULL demo — required when either is true:**
- A backlog item was completed (always, regardless of what changed), OR
- The task changed user-visible behavior

Procedure: start the app (or have the user start it via RUNBOOK.md), tell
the user exactly what to look at and what to try ("open [URL], add a note,
refresh — it should still be there"), and wait for the user to confirm they
saw it working. Their confirmation closes the gate.

**Quick re-confirm — all other coding tasks:**
The agent itself verifies the app still starts and reaches its ready state
(run the RUNBOOK.md start steps, observe the "you should see" condition),
and states this in the task summary: "Verified the app still starts and
[ready condition]." No user action needed.

**Deferral — only the user can defer:**
If the user says "skip the demo" / "I'll look later", record in the
development log: what was not demonstrated, why, and a watch item to demo
it at the next session. The DoD item is then marked
`deferred by user — [date], watch item logged`. The agent must not defer
the gate on its own initiative, and must not mark it satisfied without
either user confirmation (full demo) or its own verified start (quick
re-confirm).

### Gate evaluation (explicit, not vibes)

When closing a task, evaluate in order:

```
1. Did this task complete a backlog item?            → FULL demo required
2. Else: did user-visible behavior change?           → FULL demo required
3. Else:                                             → quick re-confirm
4. Gate satisfied only by: user confirmation (1,2),
   verified start (3), or user-initiated deferral
   (logged). Anything else = DoD FAILS → task stays
   open. Do not commit a "done" log entry.
```

### When the app cannot run yet

Before backlog item 1 is complete there is nothing to demo — the gate is
satisfied vacuously, and this is exactly why item 1 must be the walking
skeleton: the gate has teeth from the first feature onward.

---
