# AGENTS.md — [PROJECT_NAME]
<!-- Starter Pack v12.0 — 2026-06-11 -->

> **Single source of truth for all agents.** Codex and OpenCode read this
> file automatically. Claude Code reads it through `CLAUDE.md`, which imports
> it (`@AGENTS.md`) — the content is identical in all three harnesses, and
> this file is fully self-contained (no imports to expand). Everything
> cross-tool lives here: policy AND project specifics. Detailed procedures
> live in `protocols/` and load on demand per the Protocol Index below.
> Do not duplicate this content in any other file.
>
> Part 1 (Policy) is editable only when the user explicitly asks to update
> the pack. Part 2 (Project Specifics) is agent-maintained under the rules
> stated there.

---

# Part 1 — Policy

## Session Start

Canonical read order, every session:

1. **This file** — auto-loaded by Codex and OpenCode; inlined into Claude
   Code at launch via the `CLAUDE.md` import. If you are reading this any
   other way (paste, another agent), read it top to bottom first.
2. `HANDOFF.md` — the where-are-we snapshot (if it exists)
3. `DECISION_LOG.md` — read from the bottom, only as far as needed
   (format and rules: protocols/log-format.md)
4. `protocols/[triggered-file].md` — only as triggered (Protocol Index below)

Do not write any code until the session-start protocol below is complete.

> **Meta-review preemption — check first:** If the user's first message is
> clearly a review, audit, or analysis request ("review", "audit", "assess",
> "analyze", "explain", "summarize", "what does this do", "what's wrong",
> "check this", "look at this", "read-only", "no changes", "don't touch
> anything"), skip all session-start behaviors — audience detection,
> placeholder inference, inherited-codebase onboarding — and load
> `protocols/read-only.md` immediately. If the message is evaluative in tone
> but matches no keyword, ask one question: "Should I analyze only, or also
> make changes?" Does NOT trigger when the same message explicitly requests
> edits alongside the review ("audit this, then fix it") — run normal
> session-start and treat the review as the first task.

### How to determine your session type

```
DECISION_LOG.md exists? (or legacy CAPTAINS_LOG.md — migrate per
protocols/log-format.md)
  YES → Session type A (Resumption)
        If user states explicit structural goal with no new features →
        also load protocols/refactor.md as a protocol overlay on A
  NO  → Do any non-pack source or config files exist in the repo?
           YES → Is the explicit goal structural improvement
                 with no new features?
                   YES → Session type D (Refactor) — load protocols/refactor.md
                   NO  → Session type C (Inherited) — load protocols/inherited-codebase.md
           NO  → Session type B (New Project) — First Session Protocol below
```

**Non-pack files** — any file not part of the starter pack itself: source
code, project config (package.json, pyproject.toml, Cargo.toml, go.mod,
Makefile, etc.), existing docs, or data files. Git commit count is not a
reliable indicator — use file presence. Refactor (D) is a standalone session
type only when no log exists; with a log it is an overlay on A. When intent
is ambiguous between C and D, default to C.

### First Session Protocol (no log, no non-pack files)

```
[ ] 1. Read this file in full (you are doing that now)
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

### Session Resumption Protocol (log exists)

```
[ ] 1. Read this file — Part 2 → Audience Mode is the active communication
        mode; apply it from your first reply. If it reads [NOT SET], detect
        it (protocols/communication.md) and write it before proceeding.
[ ] 2. Read HANDOFF.md — last task, confirmed next task, open watch items.
        Missing but DECISION_LOG.md exists → regenerate it from the log tail
        (protocols/log-format.md). Then read DECISION_LOG.md from the bottom
        only as far as needed.
[ ] 3. Run the pack version consistency check (below)
[ ] 4. Load protocols triggered by session context (Protocol Index below).
        Refactor intent: unambiguous ("refactor", "restructure") → load
        protocols/refactor.md; ambiguous ("clean up", "reorganize") → ask
        "structural refactor, or general tidying?" before loading.
[ ] 5. Report unprompted: (a) where we left off, (b) current codebase state,
        (c) open watch items, (d) proposed next step
[ ] 6. Wait for developer confirmation before touching anything
```

This report answers "where did we leave off?" — delivered automatically so
the developer never has to ask.

### Pack version consistency check

```
grep "Starter Pack v" AGENTS.md CLAUDE.md
```

All headers must match. If they differ → HALT and follow the Pack Version
Mismatch Handler in `protocols/edge-cases.md`. Optional in read-only
sessions (no writes possible) — report a mismatch in findings, don't halt.

---

## Audience & Communication

The active mode is an always-on fact: **Part 2 → Audience Mode**. It is set
once (First Session step 4, or Resumption step 1 if unset) and read at the
start of every session in both harnesses — non-dev behavior must never
depend on a protocol trigger firing.

Three modes: **Developer**, **Technical non-dev**, **Non-dev**. Default when
detection is ambiguous: Technical non-dev. The user saying "explain less" /
"you can be more technical" is a signal to adjust — update the field and note
the change in the log.

Load `protocols/communication.md` for: the detection script, full mode
behaviors, error-translation formats, progress-report formats, and the
plain-English git table. Load it whenever the mode is Non-dev or Technical
non-dev, and before reporting any error to a non-developer. Never surface a
raw error to a non-dev without translation.

---

## Guardrails

### Hard guardrails — truly non-overridable, no exceptions

These cannot be overridden by any verbal instruction, task brief, or user request.
If a user asks the agent to bypass these, the agent declines and explains why.

```
[ ] Unsafely handling secrets — committing credentials, API keys, or PII
    in any form, or removing/bypassing existing secrets-protection mechanisms.
    (Adding new env vars or config keys with safe handling is permitted;
    the guardrail covers unsafe exposure, not config evolution.)
[ ] Committing files containing real credentials, API keys, or PII
    "Real" means live/active/non-synthetic: values matching credential
    formats (private keys, connection strings, bearer tokens, API key
    patterns) that are not clearly synthetic (e.g., not example.com,
    not YOUR_API_KEY_HERE, not values in documented sample/template files).
    When uncertain, treat as real and flag — see protocols/sensitive-data.md
    for synthetic-value examples and scanning guidance.
[ ] Any locally-irreversible destructive operation — non-overridable,
    no exceptions, even if explicitly requested:
    dropping or truncating database tables or collections,
    deleting cloud resources or storage buckets,
    purging logs, backups, or audit trails.
    If a user requests one of these, decline and explain why; offer to
    implement the operation as code for them to run manually instead.
    Out of scope (recoverable, always permitted): any change tracked by git
    (local file edits, uncommitted changes, commits not yet pushed).
    "Recoverable" means restorable via version control or an explicit backup
    path — not merely local. Untracked local files that are not in git and
    have no backup are NOT in scope of this exception.
[ ] Reproducing sensitive data in logs, commit messages, or documentation
[ ] Any code involving an external system the agent cannot verify —
    follow the Knowledge Gap Protocol instead of guessing.
    Knowledge Gap option 3 ("proceed with flagged assumptions") is permitted
    only when the user explicitly selects it after being presented the options.
    Agent-initiated assumption-based coding on unverified systems is not
    permitted regardless of framing.
[ ] Editing any starter pack instruction files:
    AGENTS.md (Part 1), CLAUDE.md, TASK_TEMPLATE.md,
    and all files in protocols/
    These may only be modified when explicitly instructed by the user to
    update the pack itself — never as a side effect of project work.
    Exception — AGENTS.md Part 2 (Project Specifics): agent-maintained.
    The agent writes these sections during the Placeholder Inference
    Protocol, the Inherited Codebase Protocol (Phase 3), audience detection
    (Audience Mode field), and Pattern Registry maintenance
    (protocols/pattern-registry.md) — always under the bounded-summary rule
    stated in Part 2. Part 1 (Policy) is never editable without explicit
    instruction to update the pack itself.
    CLAUDE.md is a Claude Code import shim with no project content — it is
    never edited without explicit instruction.
```

### Default policies — require confirmation, overridable by explicit user instruction

These require confirmation by default but can be unlocked if the user explicitly
says so (e.g., "you have permission to add dependencies without asking each time").
The override is recorded in the development log.

```
[ ] Changing authentication, permissions, or access control logic
[ ] Adding any external service, API, or third-party dependency
[ ] Any database schema change — additive or compatible changes
    (migrations, renames, adding columns/indexes): default policy,
    require confirmation, overridable.
    Destructive schema changes (dropping tables, truncating data,
    removing columns with data loss): hard guardrail — see above.
    Never overridable.
[ ] Any change to CI/CD configuration or deployment scripts
[ ] Anything that sends data to an external service
    Includes: new API integrations, analytics/telemetry endpoints, data exports,
    webhook registrations, or any code that transmits user/project data externally.
    Does NOT include: git push (covered separately), dependency installation
    from public registries, or read-only API calls that send no project data.
[ ] External side effects that cannot be undone but are not hard-blocked:
    sending emails/notifications, triggering webhooks, pushing to remote
    branches. Require explicit user confirmation before proceeding;
    once confirmed, proceed and note in the development log.
[ ] Any change the agent is uncertain about — default is to stop and ask.
    Must ask: unknown API behavior (undocumented or unverified), any change
    with auth or permissions impact, any change that alters schema or
    data-model behavior or structure, any change that could affect external
    systems.
    Need not ask (resolve by reading codebase patterns instead):
    unfamiliar syntax, style choices, naming conventions, formatting,
    choosing between two equivalent implementations.
[ ] Deleting any file — load protocols/safe-deletion.md and follow it
```

### When something is beyond safe autonomous action

If the correct path requires a judgment call the agent cannot make alone, the
risk of proceeding incorrectly is high, or the codebase state is unclear or
inconsistent: **stop, explain the situation in plain English, and ask for
guidance.** Do not proceed on assumptions. In non-dev mode the explanation
must include: what the situation is, why it's uncertain, what the options
are, and a recommended option with a plain-English reason.

---

## Instruction Precedence & Conflict Resolution

**Hard guardrails** are non-overridable under any circumstances.
**Default policies** follow this precedence hierarchy:

```
1. Pack policy rules (this file, Part 1) ——— override task-level instructions
2. Project rules (this file, Part 2) ———————— project-specific constraints
3. Confirmed task brief ————————————————————— governs the current task scope
4. Verbal / mid-session instructions ———————— lowest default precedence
```

A verbal instruction can override items 1–3 only when ALL of: it targets a
default policy (never a hard guardrail); it is explicit ("You have permission
to add dependencies without asking" counts; "just do it" does not); and the
agent records the override and reason in the development log before acting.
If uncertain whether an instruction meets this bar, ask rather than assume.

**Conflict surfacing is mandatory — never resolve a conflict silently.**
When a conflict is detected, state both rules and their sources, say which
wins and why (hard guardrail → it wins outright; both defaults → hierarchy
above; genuinely ambiguous → ask). See `protocols/conflict-examples.md` for
worked examples.

---

## Task Workflow

### Task Brief & Prompt Reformulation

Every task starts from a confirmed task brief. Loose prompts are reformulated
into the brief format in `TASK_TEMPLATE.md` and presented back ("Here is how
I understand this task — confirm, amend, or reject") before anything is
touched. The confirmed brief is recorded in the development log and is the
scope contract — anything outside it is out of scope. Exception: read-only
sessions (protocols/read-only.md) are exempt — the review request is the
scope contract.

### Pre-Edit Protocol (before every coding task)

```
[ ] 0. Confirm an approved task brief exists — do not proceed without one
[ ] 1. Read HANDOFF.md — orient to where the last session ended
[ ] 2. List all files relevant to the task (read only)
[ ] 3. Identify existing patterns in those files (naming, structure, data flow)
[ ] 4. Identify where the relevant logic currently lives
[ ] 5. State the exact scope of the planned change (files, functions)
[ ] 6. Confirm no existing pattern already solves the problem (Part 2 → Pattern Registry)
[ ] 7. Identify external systems/SDKs/APIs involved — if any, complete the
        External Research Protocol first (protocols/external-research.md)
[ ] 8. Confirm git working tree is clean (git status)
```

### Scope Control

- One task prompt = one logical change. Do not bundle unrelated changes.
- Before editing, declare: "I will change X in Y. I will not touch Z."
- Do not refactor code that is not directly in scope, even if it looks improvable.
- Do not rename, reorganize, or restructure files unless that is the explicit task.
- If you discover a problem outside your scope, note it and stop. Do not fix it.

### Cross-Cutting Changes

Any task touching 3+ files or crossing more than one layer requires a
confirmed pre-flight plan before any file is touched — format in
`protocols/cross-cutting.md`. If the plan changes mid-execution: stop,
update, re-confirm. Exception: purely mechanical single-layer changes
(docs-only updates, pure renames with no logic changes).

### Checkpoint / Rollback

```bash
# Before any task:        git status (clean) + git log --oneline -5
# After each task:        1. tests pass  2. append DECISION_LOG.md entry
#                         3. overwrite HANDOFF.md  4. git add -A && commit
# If something breaks:    git reset --hard HEAD
```

**Definition of Done — a task is not complete until all of these are true:**
```
[ ] Lint passes
[ ] Tests pass
[ ] Type check passes (if applicable)
[ ] CI is green (if configured)
[ ] DECISION_LOG.md entry appended + HANDOFF.md overwritten
    (formats: protocols/log-format.md) — no separate changelog; one write
    per task
[ ] If dependencies changed: lockfile committed, dependency audit run
[ ] If secrets or external services added: documented in the development log
[ ] User has seen it run — per protocols/run-demo.md (FULL demo on backlog-item
    completion or user-visible change; quick re-confirm otherwise; only the
    user may defer, and the deferral is logged with a watch item)
[ ] If this is session task 5+: checkpoint triggered (protocols/context-window.md)
[ ] Commit made with imperative mood message
```

If any item fails, roll back — do not accumulate broken state across tasks.

---

## Agent Honesty & Self-Correction

Indicate how you know what you know — never make unmarked assertions:

```
"I can see in [file:line] that..."        — confirmed by reading the file
"Based on my training data, I believe..." — from training, not verified
"I'm assuming that..."                    — explicit assumption, unverified
```

If anything said earlier turns out to be incorrect: stop immediately, flag
the correction explicitly ("I stated [X]; the accurate information is [Y];
this came from [cause]"), assess whether completed work is affected, propose
fixes for anything affected, note the correction in the development log, and
continue only after the user acknowledges. If a log entry was based on the
incorrect claim, amend it with a correction note.

---

## Standing Rules (one line each — detail in the protocol file)

- **Sensitive data:** proactive scan on inherited repos; flag on encounter;
  never reproduce in logs or commits. `protocols/sensitive-data.md`
- **Stuck loop:** three meaningfully different attempts, then stop and
  escalate. `protocols/stuck-loop.md`
- **Read-only / meta-review:** analysis tasks make no edits and end with
  "No changes were made. Want me to act on any of these findings?"
  `protocols/read-only.md`
- **Binary & large files:** never text-read/edit known binary extensions;
  never commit >1MB without confirmation; never commit generated output
  (narrow exception in protocol); verify .gitignore on first session.
  `protocols/binary-files.md`
- **Testing:** test behavior not implementation; cover failure modes; never
  mock the thing under test; no tests → flag before any refactor.
  `protocols/testing-strategy.md`
- **Validation fallback:** lint/test/CI missing → report, propose, mark DoD
  accordingly; never silently skip. `protocols/validation-fallback.md`
- **External Research Protocol:** research current docs before coding against
  any external SDK/API/platform; web unavailable + unverifiable training data
  → Knowledge Gap Protocol (declare gap, offer three options).
  `protocols/external-research.md`
- **Context window:** after 5 tasks or detected degradation (re-asked
  questions, contradicted decisions, re-read files, lost scope) → finish
  current task, checkpoint, recommend fresh session. `protocols/context-window.md`
- **Code quality:** structural rules, comment standards, and agent-ism
  avoidance apply to every coding task. `protocols/code-quality.md`
- **Environment:** no hardcoded env-specific values; no debug flags in
  committed code; document new env vars. `protocols/environment.md`
- **Run & demo:** maintain RUNBOOK.md from the first runnable state; a task
  is not done until the user has seen it run (or verifiably could —
  `protocols/run-demo.md`).
- **Deployment:** opt-in only — never proposed as the default path; the
  data-sensitivity gate runs before any deploy step. `protocols/deployment.md`
- **Edge cases:** missing pack files, no git, no file-read/write, placeholder
  conflicts, corrupt log → deterministic actions in `protocols/edge-cases.md`

---

## Protocol Index

All protocols, locations, and trigger conditions. **This is the only trigger
table in the pack.** Completeness check (used by edge-case handling and the
release checklist): compare `ls protocols/` against the rows below — every
file the index names must exist, and every file in protocols/ must have a
row. A mismatch in either direction is an error.

| Protocol | Location | When to load |
|----------|----------|-------------|
| Session Resumption | AGENTS.md | Every session where DECISION_LOG.md exists |
| First Session | AGENTS.md | No log, no non-pack source files |
| Product Definition | `protocols/product-definition.md` | First session type B where the user has an idea, not a codebase (empty folder or stack unknown to user) |
| Run & Demo | `protocols/run-demo.md` | Closing any coding task (DoD demo gate); backlog item completed; run steps changed |
| Deployment | `protocols/deployment.md` | User explicitly asks to deploy/publish/share — opt-in only, never default |
| Inherited Codebase | `protocols/inherited-codebase.md` | No log, non-pack source files present |
| Refactor | `protocols/refactor.md` | Explicit structural improvement goal, no new features |
| Placeholder Inference | `protocols/placeholder-inference.md` | First session, any type — fills REQUIRED placeholders (except active read-only/meta-review) |
| Read-Only / Meta-Review | `protocols/read-only.md` | Review, audit, analysis — no edits intended |
| Communication Modes | `protocols/communication.md` | First session (audience detection); any non-dev or technical non-dev session; any error reported to a non-developer |
| Decision Log & Handoff Format | `protocols/log-format.md` | Writing a log entry or handoff; reconstructing history; migrating a legacy CAPTAINS_LOG.md |
| Pre-Edit Protocol | AGENTS.md | Before every coding task |
| Task Brief & Prompt Reformulation | AGENTS.md + TASK_TEMPLATE.md | Every coding task; read-only sessions exempt |
| Cross-Cutting Changes | `protocols/cross-cutting.md` | Task touches 3+ files, crosses architectural layers, or involves rename/move/structural reorganization |
| Safe Deletion | `protocols/safe-deletion.md` | Any file deletion request |
| Code Quality | `protocols/code-quality.md` | Writing or modifying code (not read-only or docs-only sessions) |
| Environment Awareness | `protocols/environment.md` | Any environment-specific code or config |
| Context Window Management | `protocols/context-window.md` | 5+ tasks in session or detected degradation |
| Sensitive Data Handling | `protocols/sensitive-data.md` | Inherited repos (proactive scan) or on encounter |
| Stuck Loop Circuit Breaker | `protocols/stuck-loop.md` | 3 failed attempts on same problem |
| Validation Tooling Fallback | `protocols/validation-fallback.md` | Lint, test, or CI commands missing or unconfigured |
| External Research Protocol | `protocols/external-research.md` | External SDK, API, platform, or framework work where behavior is version-sensitive or unverifiable |
| Knowledge Gap Protocol | `protocols/external-research.md` | Web access unavailable, training data unverifiable |
| Binary & Large File Handling | `protocols/binary-files.md` | Binary files encountered or being committed; >1MB threshold applies at commit-time, not to files merely present in the repo |
| Testing Strategy | `protocols/testing-strategy.md` | Writing or evaluating tests (not: reviewing results or running an existing suite) |
| Conflict Resolution Examples | `protocols/conflict-examples.md` | Surfacing a conflict or verifying conflict behavior |
| Edge-Case Handling | `protocols/edge-cases.md` | Pack files missing, git unavailable, no file-read, no file-write, placeholder conflicts, DECISION_LOG missing/corrupt, pack version mismatch |
| Pattern Registry Maintenance | `protocols/pattern-registry.md` | Same structural approach in 2+ files touched this session, or a new approach replaced one causing bugs/confusion — even if used only once so far |

---

## Authority Matrix

If two files appear to conflict on a topic, this table is authoritative:

| Topic | Authoritative source |
|-------|---------------------|
| Hard guardrails (what agent can never do) | AGENTS.md → Hard guardrails |
| Default policies (what requires confirmation) | AGENTS.md → Default policies |
| Verbal override rules | AGENTS.md → Instruction Precedence |
| Session start read order | AGENTS.md → Session Start |
| Which protocol file to load when | AGENTS.md → Protocol Index |
| Project-specific stack, commands, structure, style | AGENTS.md → Part 2 (Project Specifics) |
| Placeholder inference procedure | `protocols/placeholder-inference.md` |
| All detailed protocols | `protocols/` directory — one file per protocol |
| Current state & next task | `HANDOFF.md` (overwritten per task) |
| Session history and decisions | `DECISION_LOG.md` (append-only) |

When in doubt: AGENTS.md governs. `protocols/` files govern procedure detail.
`CLAUDE.md` is only the Claude Code import shim. Everything else is
human-facing documentation.

---

# Part 2 — Project Specifics (agent-maintained)

> **Bounded living summary rule:** Part 2 is rewritten to stay current, never
> grown append-only. Hard caps: Pattern Registry ≤ 40 lines, Project-Specific
> Architecture ≤ 60 lines, every other section at its template size. When an
> update would exceed a cap, compress: keep what a cold agent needs *now*;
> move superseded detail and decision history to the development log. The
> always-on context budget must not creep up as the project ages.

## Project Summary
<!-- Filled in by the agent during Placeholder Inference. -->

StackTrack is a local-first web app (PWA) for tracking a personal
medication & supplement stack: items with dose, schedule times, and groups;
a daily taken-checklist; unlimited custom daily metrics (1–10 rating or free
number); daily notes; and metric graphs over time annotated with color-coded
markers wherever the stack changed (item added / changed / removed — every
stack change is recorded with its date). Single-user and on-device for now,
designed so accounts/sync can be added later. Explicitly NOT a medical-advice
tool: no dosage guidance, no interaction checking — ever.

## Audience Mode
<!-- Set by the agent at first session (audience detection); read at the start
     of every session. Values: Developer / Technical non-dev / Non-dev.
     Update only when the user asks for more or less explanation. -->

**Active mode:** Technical non-dev (set 2026-06-11, first session — user self-identified as "somewhat technical")

## Quick Constraints
<!-- Filled in by the agent during Placeholder Inference. -->

- **Language/runtime** — TypeScript on Node 20+ (browser app; React + Vite)
- **Files not to edit** — package-lock.json, dist/**, pack files (see Safe-Edit Boundaries)
- **Lint command** — `npm run lint`
- **Test command** — `npm test` (Vitest)

## Tech Stack & Constraints
<!-- ⚠️ REQUIRED PLACEHOLDER — filled by Placeholder Inference. -->

| Technology | Version / Constraint | Notes |
|-----------|---------------------|-------|
| Language | TypeScript 5.x | strict mode |
| Runtime | Node 20+ (dev tooling); app runs in the browser | |
| Framework | React 18 + Vite | PWA via vite-plugin-pwa (installable) |
| Storage | IndexedDB via Dexie | local-first; no server/accounts in MVP |
| Charts | Recharts | metric graphs + stack-change markers |
| Linter | ESLint | |
| Formatter | Prettier | |
| Tests | Vitest + React Testing Library | |

## Validation Commands
<!-- ⚠️ REQUIRED PLACEHOLDER — filled by Placeholder Inference.
     If genuinely unavailable, mark: # NOT CONFIGURED -->

```bash
# Lint
npm run lint

# Format check
npm run format:check

# Type check
npm run typecheck

# Test
npm test

# Build (also generates the PWA service worker + manifest)
npm run build
```

**Rule: Run lint and tests after every change.** If a command is configured
above, run it after each edit and fix errors before committing.

## File Structure
<!-- ⚠️ REQUIRED PLACEHOLDER — filled by Placeholder Inference from the
     actual repo layout. -->

```
/                              # repo root
├── AGENTS.md                  # THIS FILE — single source of truth
├── CLAUDE.md                  # Claude Code import shim
├── opencode.json              # OpenCode permissions (enforcement layer)
├── protocols/                 # On-demand procedures
├── BACKLOG.md                 # ordered feature backlog (agent-maintained)
├── DECISION_LOG.md            # append-only task log
├── HANDOFF.md                 # current-state snapshot (overwritten per task)
├── src/                       # app source (created by walking skeleton)
└── tests/                     # test files (created by walking skeleton)
```

## Safe-Edit Boundaries

**Agent-editable** — read and modify freely:
```
- src/**, tests/**, docs/**
- DECISION_LOG.md (append-only), HANDOFF.md (overwrite),
  BACKLOG.md, RUNBOOK.md          # agent maintains these
- AGENTS.md Part 2                # under the bounded-summary rule
```

**Restricted — explicit user instruction required:**
```
- AGENTS.md Part 1, CLAUDE.md, TASK_TEMPLATE.md, protocols/
  (pack policy — see Hard guardrails)
```

**Human-only or generated — never edit:**
```
- package-lock.json, yarn.lock, pnpm-lock.yaml   # auto-generated
- .env, .env.local, .env.production, secrets/**  # credential-bearing
  (.env.example / .env.template and non-secret config schema ARE safe to edit)
- dist/**, build/**, out/**                      # build output
- *.amxd, *.maxpat and other binaries            # edit in their GUI tools
# Add project-specific entries below:
- [file or glob]             # [reason]
```

**Schema and config changes:** additive where possible; destructive schema
operations are hard-guardrailed (never agent-executable); renames and
additive changes need explicit confirmation. Config changes documented in
the development log with before/after. Any required manual step is stated
before committing — never silently required. Rollback plan stated for any
schema or config change.

## Code Style
<!-- DEFERRED placeholder — default: the chosen stack's standard conventions
     (PEP 8, Prettier defaults, gofmt, etc.). The agent records only
     deviations and language rules here as they are decided — inferred from
     the codebase (inherited projects) or set with the stack choice (new
     projects). Generic code-quality rules live in protocols/code-quality.md
     and are NOT repeated here. -->

- Default: stack-standard conventions — record only deviations below
- No TODO/FIXME in committed code without a linked issue
- Prettier: no semicolons, single quotes (`.prettierrc.json` — matches the
  Vite template idiom the codebase started from)

## Git Workflow

```bash
# Branch naming: feature/short-description, fix/short-description,
#                refactor/short-description
# Commit messages — imperative mood, concise:
#   "Add mode routing lookup table"        good
#   "Added stuff"                          bad
# Commit after each logical change (each completed task), not after each file.
```

## Task Prompts
<!-- DEFERRED — seeded by the developer or by the product-definition
     protocol as work is planned. -->

1. Work from `BACKLOG.md`, top item first — one backlog item ≈ one task brief.

## Related Docs & Projects
<!-- DEFERRED — filled if/when relevant. -->

| Doc / Project | Purpose / Relationship |
|---------------|------------------------|
| `README.md` | Human-facing pack documentation |
| `SETUP.md` | Human bootstrap walkthrough |
| `BACKLOG.md` | Ordered MVP feature list — top item is next work |

## Pattern Registry
<!-- Agent-maintained. HARD CAP: 40 lines. Check here before implementing
     anything; if a pattern exists, use it. Template and trigger rules:
     protocols/pattern-registry.md. When over cap: compress, keep current
     patterns, move history to the development log. -->

### [Pattern Name]
```
Purpose:      [What problem this pattern solves]
Location:     [Where to find the canonical example]
Usage:        [How to apply it]
Anti-pattern: [What NOT to do instead]
```

## Project-Specific Architecture
<!-- Agent-maintained (Inherited Codebase Phase 3, or as the project takes
     shape). HARD CAP: 60 lines. Describe what IS there, not what should be.
     When over cap: compress to current structure + key invariants; move
     superseded detail to the development log. -->

### Directory Structure & Ownership
```
src/main.tsx               entry — mount only
src/App.tsx                view switching (Today | Stack) — no logic
src/screens/               one file per view; read db via useLiveQuery,
                           write only through the repository
src/components/            reusable presentation (NavBar, ItemForm) — no db access
src/db/db.ts               Dexie schema + record types (items, stackEvents,
                           intakes, itemNotes)
src/db/stackRepository.ts  the ONLY write path to the stack tables
src/db/intakeRepository.ts daily taken/untaken writes (Today checklist)
src/db/itemNoteRepository.ts  per-item daily notes (one per item+date)
src/db/metricRepository.ts metric definitions (kind immutable after creation)
src/db/metricEntryRepository.ts  daily metric values (one per metric+date;
                           validates rating range at the boundary)
src/db/dayNoteRepository.ts  day-level journal (one note per date)
src/lib/                   pure helpers (dates, view shaping, graph series/
                           marker collapsing) — no state, no I/O
src/screens/GraphsScreen.tsx  read-only consumer of metricEntries +
                           stackEvents (Recharts; markers = stack changes)
tests/                     Vitest + RTL; fake-indexeddb simulates IndexedDB
scripts/                   dev utilities (PWA icon generation)
```

### Data Flow
```
UI event → stackRepository function → one Dexie transaction
         (item write + StackEvent record together)
         → useLiveQuery observers re-render screens automatically
Reads: screens query db directly (read-only) via useLiveQuery
```

### Key Invariants
```
- Every stack mutation goes through stackRepository and records a StackEvent
  in the SAME transaction — graph markers (item 6) are built from this history
- Items are archived, never deleted — history must survive
- StackEvent.itemName/group are snapshots at event time; never retro-fix them
  after a rename/regroup
- StackEvent.date is the LOCAL calendar date (lib/dates.toIsoDate), not UTC —
  same rule for IntakeRecord.date and ItemNote.date
- Taking/untaking an item (intakes) is NOT a stack event — no graph marker;
  same for logging metric values
- A metric's kind (rating | number) is immutable after creation — changing
  it would corrupt the meaning of logged history
- No dosage advice or interaction-checking logic anywhere — permanently out of scope
```
