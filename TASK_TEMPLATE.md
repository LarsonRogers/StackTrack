# Task Brief Template
<!-- Starter Pack v12.19 — 2026-06-18 -->

## For the agent — prompt reformulation protocol

When you receive any task prompt that is not already structured as a task brief,
you must reformulate it before doing any work.

**The flow is:**
1. Receive loose natural language prompt from the developer
2. Reformulate it into the task brief structure below
3. Present the reformulated brief to the developer with the message:
   "Here is how I understand this task — please confirm, amend, or reject
   before I proceed."
4. Wait for explicit confirmation. Do not begin work on a rejected or
   unanswered brief.
5. Once confirmed, the brief becomes the log entry for this task — record
   it in the DECISION_LOG.md entry for this task before starting work.

The reformulation step is not optional. It exists to surface mismatches between
what the developer asked and what the agent understood, before any code is written.
If the brief reveals ambiguity the agent cannot resolve, list the open questions
explicitly and ask for clarification rather than assuming.

---

## Task Brief

**Objective**
[One clear sentence: what should be true when this task is done?]

**Context**
[What is relevant to this task — specific files, functions, prior decisions,
or DECISION_LOG.md entries the agent should be aware of]

**Task type**
- [ ] Coding task (edits, commits, full DoD applies)
- [ ] Analysis / read-only (no edits — use lightweight checklist below)

**Acceptance criteria — coding task**
*(skip this section for analysis/read-only tasks)*
- [ ] [Specific, verifiable outcome]
- [ ] [Specific, verifiable outcome]
- [ ] Lint and tests pass
- [ ] Type check passes (if applicable)
- [ ] CI green (if configured)
- [ ] Decision log entry appended, HANDOFF.md overwritten
- [ ] If dependencies changed: lockfile committed, audit run

**Acceptance criteria — analysis / read-only task**
*(skip this section for coding tasks)*
- [ ] [Specific findings or report delivered]
- [ ] No files modified or created
- [ ] Ends with: "No changes were made. Want me to act on any of these findings?"
- [ ] Decision log updated only if user requests it

**Constraints**
- Do not modify: [files or systems off-limits for this task]
- Do not change: [behavior, interface, or schema that must stay the same]
- [Any other hard limits]

**Out of scope**
[What is explicitly NOT part of this task — improvements, refactors, or
related work that should not be touched. This section prevents scope creep.]
- [Related thing that should not be touched]
- [Deferred improvement that is tempting but out of scope]

**Open questions**
[Anything the agent cannot resolve from the codebase or prior context alone.
List these and wait for answers before proceeding if they affect the approach.]
- [Question, if any]

**References**
- [Relevant file paths, DECISION_LOG.md entry dates, external docs]

---

## Notes for humans

You can give the agent a loose prompt and let it reformulate — that is the
intended flow. But you can also fill this out yourself and hand it in directly
if you want precise control over scope from the start. Either way, no work
begins until the brief is confirmed.

One brief = one logical change. If the objective requires "and" to describe,
split it into multiple briefs.
