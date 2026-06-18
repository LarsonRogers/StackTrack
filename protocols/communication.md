<!-- Starter Pack v12.16 — protocols/communication.md -->
<!-- Load this file when: first session (audience detection needed); any session where
     audience mode is Non-dev or Technical non-dev; or any error/progress report must
     be delivered to a non-developer. -->
<!-- Does NOT trigger when: audience mode is Developer and no error translation or
     expanded progress reporting is needed — the core summary in AGENTS.md
     is sufficient for developer sessions. -->
<!-- Do not load unless triggered — see AGENTS.md → Protocol Index -->

## Audience Detection & Communication Modes

The agent adapts its communication style, explanation depth, and confirmation
behavior to who it is working with. Three modes:

**Developer** — full technical mode, concise updates, minimal explanation of
standard operations, higher autonomy on routine tasks.

**Technical non-dev** — comfortable with concepts and can read technical
output, but not living in code day-to-day. Plain English by default, technical
terms used when they're the clearest option but briefly glossed. Moderate
autonomy. Errors explained but not over-explained.

**Non-dev** — plain English throughout, no jargon without explanation, maximum
guardrails, every action explained before it happens, full error translation,
expanded progress reports.

### Detecting the audience

At the very start of a first session (no log, or no recorded audience mode),
open with a natural, conversational exchange — not a form:

**Step 1 — opening question:**
```
"Quick question before we start — are you a developer or engineer, or are you
coming at this from a different angle? There's no wrong answer, it just helps
me calibrate how much I explain."
```

**Step 2 — follow-up only if the answer is ambiguous:**
```
"Do terms like git, dependencies, and stack mean something to you, or would
you rather I avoid that kind of language and keep things plain English?"
```

Two exchanges maximum. Map the response:

```
"I'm a developer / engineer / I code professionally"  →  Developer
"I know some things / I've dabbled / I understand     →  Technical non-dev
 the concepts but don't code regularly"
"I'm not technical / I'm new to this /                →  Non-dev
 please keep it simple"
```

When uncertain, default to **Technical non-dev** — the most adaptive mode and
the easiest to adjust from.

Record the mode in two places: **AGENTS.md → Part 2 → Audience Mode** (the
always-on fact every session reads at start, in both harnesses) and the
development log's first entry (the audit trail). Do not ask again unless the
user requests a change ("explain less" / "you can be more technical" are
signals to adjust — update the AGENTS.md field and note the change in the log).

### Mode behaviors

**Developer:**
- Technical terminology used freely
- Git operations run silently with a one-line confirmation
- Errors surfaced with full technical detail plus a one-line diagnosis
- Post-task summary is concise (what changed, what's next)
- Confirmation required for: destructive operations, schema changes,
  anything outside agreed scope

**Technical non-dev:**
- Plain English by default; technical terms when clearest, with a brief gloss
  on first use — e.g., "dependencies (the external libraries your code relies on)"
- Git operations run silently; explained in plain terms if something goes wrong
- Errors explained in plain English with cause and options — raw output
  included but below the explanation, not instead of it
- Post-task summary covers what changed and why it matters, without excessive
  hand-holding
- Confirmation required for: anything outside agreed scope, destructive
  operations, external services, schema changes
- Assumes the user can make informed decisions when given clear context

**Non-dev:**
- No jargon without a plain-English explanation
- Every action explained before it is taken: "I'm going to save a checkpoint
  of the current code before making changes — this means we can undo everything
  if something goes wrong. Ready?"
- Git handled entirely by the agent, explained in plain terms only when
  something goes wrong or a decision is needed
- All errors translated (see Error Translation below)
- Post-task progress report in plain English (see Progress Reporting below)
- Confirmation required for: anything that changes the codebase, any external
  service or API, any operation that cannot be easily undone

### Non-dev mode: additional confirmation requirements

```
[ ] Before every task (confirmed task brief — already required for all modes)
[ ] Before running any command that modifies the filesystem
[ ] Before committing — show a plain-English summary of what will be saved
[ ] Any time an error occurs — explain and offer options before retrying
[ ] Any time the agent encounters something unexpected or outside the brief
```

---

## Error Translation

When any command, test, lint check, or operation fails, never surface a raw
error to a non-dev user without translation.

### Error response format (non-dev mode)

```
**What happened:**
[Plain English — one sentence describing what failed]

**Why it happened:**
[Plain English — the most likely cause, without assuming prior knowledge]

**What this means for the project:**
[Is this blocking? Is the code broken, or just a style warning?]

**Options:**
1. [Most likely fix — what the agent will do if you say yes]
2. [Alternative if applicable]
3. Skip for now and flag it — [when this is safe to do]

**My recommendation:** [Option N] because [plain-English reason].

Say "yes" to proceed with my recommendation, or tell me which option you prefer.
```

### Error response format (technical non-dev mode)

```
**What failed:** [One plain-English sentence]

**Most likely cause:** [Plain English, technical term allowed if clearest]

**Options:**
1. [Recommended fix — what the agent will do]
2. [Alternative if applicable]

**My recommendation:** Option N — [brief reason]

[Raw error output, collapsed or below a "Technical detail:" label]
```

### Error response format (developer mode)

Surface the raw error with a one-line diagnosis and proposed fix. No expansion
unless asked.

---

## Progress Reporting

After every completed task, report what happened.

### Progress report format (non-dev mode)

```
**Done: [task name]**

What changed:
- [Plain English — what is different about the project now]
- [Avoid file paths and function names unless necessary; if used, explain them]

What this means:
- [Why this change matters — what it enables or fixes]

Current state of the project:
- [One sentence on overall project health]

What's next:
- [The next logical step, or a prompt to tell the agent what to work on]

[If anything was flagged or deferred:]
Worth knowing: [plain-English note about anything the agent noticed but
didn't act on, and whether it needs attention]
```

### Progress report format (technical non-dev mode)

```
Done: [task name]

What changed: [plain English, with file paths or function names where useful
— no need to avoid technical terms, just don't lead with them]

Why it matters: [one sentence on what this enables or fixes]

Anything to know: [flagged items, deferred decisions, or loose ends —
brief and direct, no over-explanation]

Next: [suggested next step or prompt for input]
```

### Progress report format (developer mode)

```
Done: [task name]
Changed: [files and what changed]
State: [brief project health note]
Next: [suggested next step]
```

---

## Plain-English Git Guidance (non-dev mode)

The agent handles all git operations silently in non-dev mode. The user does
not need to know git commands. Explain git concepts only when a decision or
problem requires it, using plain language:

```
Git concept          Plain-English equivalent
────────────────────────────────────────────────────────────────
commit               "saving a checkpoint of the current code"
branch               "a separate working copy of the project"
rollback / reset     "restoring the code to the last saved checkpoint"
merge                "combining two versions of the code"
push                 "uploading the saved code to the cloud/remote"
pull                 "downloading the latest code from the cloud/remote"
conflict             "two versions of the same file that disagree"
```

When a git operation fails or requires a decision, explain it using the
plain-English equivalent and offer clear options. Never ask a non-dev to run
a git command directly unless there is no other way.

---
