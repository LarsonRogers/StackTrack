<!-- Starter Pack v12.0 — protocols/read-only.md -->
<!-- Load this file when: review, audit, analysis, or any task with no intended edits -->
<!-- Does NOT trigger when: user explicitly authorizes edits in the same message
     (e.g., "review this and fix any issues you find" — that is an edit session
     with an audit component, not a read-only session). When intent is ambiguous,
     ask once before assuming read-only. -->
<!-- Do not load unless triggered — see AGENTS.md → Protocol Index -->

## Read-Only / Meta-Review Protocol

Use this protocol when the task is analysis, review, audit, or documentation
only — no code changes, no commits, no Definition of Done workflow.

### When this applies

```
- Code review or audit request
- Architecture assessment
- Documentation review
- Security or dependency scan
- "Tell me what this does" / "What's wrong with this?"
- Any task where the user explicitly says no changes should be made
```

### Trigger recognition

If a task brief contains any of the following signals, default to this
protocol unless the user explicitly requests edits:

```
"review", "audit", "assess", "analyze", "explain", "summarize",
"what does this do", "what's wrong", "check this", "look at this",
"read-only", "no changes", "don't touch anything"
```

> **Note:** AGENTS.md carries a fast-match trigger set for first-message
> detection ("review", "audit", "assess", "analyze", "explain", "summarize",
> "what does this do", "what's wrong", "check this", "look at this",
> "read-only", "no changes", "don't touch anything"). This file is the
> canonical source for protocol behavior once triggered. AGENTS.md is a
> quick-match filter only — when in doubt, defer to this file.

### Protocol

```
[ ] 1. Confirm read-only mode before starting.
        If the user's opening message explicitly requested review, audit,
        analysis, or no changes — that request counts as confirmation.
        No additional confirmation step is required; proceed directly.
        If ambiguous, ask once:
        "I'll treat this as a read-only review — no edits or commits.
        Confirm, or let me know if you'd like me to make changes too."
[ ] 2. Read the relevant files — do not stage, modify, or create any file
[ ] 3. Produce the requested analysis, review, or report
[ ] 4. Deliver findings in the format appropriate to audience mode.
        If no audience mode is recorded (e.g. first-message audit with no
        prior decision log), default to Technical non-dev.
        - Developer: prioritized list, concise, specific file/line references
        - Technical non-dev: plain English with technical detail where useful
        - Non-dev: plain English, options and recommendations, no jargon
[ ] 5. End with a clear prompt:
        "No changes were made. Want me to act on any of these findings?"
[ ] 6. Do NOT update DECISION_LOG.md or HANDOFF.md unless the user asks
[ ] 7. Do NOT run lint, tests, or commit checks unless the user explicitly
        requests verification evidence as part of the audit (e.g., "run tests
        and show me the results"). Non-mutating checks only — no fixes, no
        commits, no auto-formatting. If requested checks are unavailable or
        unconfigured, invoke protocols/validation-fallback.md rather than
        silently skipping or improvising. In read-only mode, report all
        fallback findings in-chat only — do not update the decision log
        or Definition of Done unless the user explicitly requests it.
```

### Suspended in read-only mode

Pre-edit protocol, task brief / scope contract, Definition of Done checklist,
checkpoint / rollback strategy, decision log / handoff update (unless requested).

### Still active in read-only mode

Audience mode communication, sensitive data handling (never reproduce
credentials or PII), honest verification language, hard guardrails.

---

### Inherited Codebase (Existing project, no prior log)

When the task is read-only and no decision log exists, skip the full
Inherited Codebase Protocol onboarding flow. Instead:

```
[ ] 1. Read available source files to understand the codebase at a surface level
[ ] 2. Deliver your analysis or review findings
[ ] 3. End with: "No changes were made. Want me to act on any of these findings?"
[ ] 4. If the user confirms they want work done, exit read-only mode and
       run the Inherited Codebase Protocol (protocols/inherited-codebase.md)
       before touching any files.
```

Do not fill placeholders, do not create DECISION_LOG.md, do not run
audience detection until the user confirms active work is needed.