<!-- Starter Pack v12.0 — protocols/inherited-codebase.md -->
<!-- Load this file when: no decision log exists and non-pack source files are present -->
<!-- Does NOT trigger when: first message is a read-only audit or meta-review (load
     protocols/read-only.md instead), or when no non-pack source files are present
     (that is a first-session with no existing codebase — see session type B). -->
<!-- Do not load unless triggered — see AGENTS.md → Protocol Index -->


This is the case when the starter pack has been dropped into an existing repo
that was not built with this setup. The codebase exists, but there is no
`DECISION_LOG.md`, no filled-in project sections in `AGENTS.md`, and no
established workflow.

**The agent must not write or change any code until the full assessment is complete.**

#### Phase 1 — Read and Map (no edits)

```
[ ] 1. Read AGENTS.md in full (Part 1 policy and Part 2 project sections)
[ ] 2. Map the repo structure:
        Standard repos: list every directory and file
        Large repos (100+ directories or 500+ files): summarize top-level
        structure and key modules first, then expand into areas of highest
        risk or centrality (entry points, core business logic, shared
        utilities). Do not attempt a full recursive dump — flag that a
        staged approach is being used.
[ ] 3. Identify and read: entry points, config files, package manifests,
        dependency lists, any existing README or docs
[ ] 4. Read the git history — see Git History Reconstruction below
[ ] 5. Scan for sensitive data — credentials, PII, API keys (see Sensitive
        Data Handling protocol). Report findings before any other work proceeds.
[ ] 6. Read the most-changed and most-central source files in full
[ ] 7. Identify the tech stack — languages, frameworks, runtimes, versions
```

#### Git History Reconstruction

For inherited codebases, the git history is a low-fidelity decision log that
already exists. The agent must read and synthesize it into reconstructed
`DECISION_LOG.md` entries before the first live entry is written.

**How far to go back:**
The agent judges based on repo size and history depth:
- Small repo or few commits — read the full history
- Medium repo — read until the history becomes redundant or pre-dates the
  current codebase shape (major refactors, renames, or rewrites are a natural
  stopping point)
- Large repo with hundreds of commits — focus on: the earliest commits
  (establish intent), major inflection points (large diffs, branching patterns,
  commit message tone changes), and the most recent 20-30 commits (current state)
- In all cases: read diffs for significant commits, not just messages

**Reconstruction commands:**
```bash
# Full log with dates and authors
git log --oneline --all

# Identify high-churn files (signals complexity and problem areas)
git log --all --format=format: --name-only | sort | uniq -c | sort -rg | head -20

# Read diff for a specific commit
git show [commit-hash]

# See what changed between two points
git diff [older-hash] [newer-hash] --stat
```

**Reconstructed entry format:**

Reconstructed entries use the standard DECISION_LOG.md entry format with a
RECONSTRUCTED marker (full spec: protocols/log-format.md → Inherited
codebases). Appended oldest-first, so reconstruction and live entries form
one chronological append-only stream — the first live entry simply follows
at the bottom.

#### Phase 2 — Assess and Report

After mapping, the agent must produce a written assessment covering:

```
1. Tech stack — what is confirmed present and at what versions
2. Inferred architecture — how the code is actually structured
   (even if poorly — describe what IS there, not what should be there)
3. Entry points — where execution begins, how requests/events flow
4. Problem areas — tech debt, dead code, inconsistent patterns,
   missing error handling, hardcoded values, security concerns
5. Unknown or unclear areas — anything ambiguous that needs developer input
6. Dependency health — outdated, deprecated, or abandoned packages
7. Test coverage — what is tested, what is not, whether tests pass
```

Do not soften the assessment. If the codebase is in poor shape, say so clearly
and specifically. The developer needs an honest picture before deciding what to do.

#### Phase 3 — Build Out Project Docs

After the developer has reviewed the assessment:

```
[ ] 1. Fill in AGENTS.md → Part 2 → Project-Specific Architecture
        based on what was found — actual structure, not ideal structure
        (bounded living summary, hard cap 60 lines)
[ ] 2. Fill in AGENTS.md → Part 2 → Pattern Registry with any patterns that
        exist in the code, including anti-patterns worth flagging
        (bounded living summary, hard cap 40 lines)
[ ] 3. Fill in AGENTS.md → Part 2 → Tech Stack table
[ ] 4. Fill in AGENTS.md → Part 2 → File Structure section
[ ] 5. Finalize DECISION_LOG.md and create HANDOFF.md:
        - Reconstructed entries (from git history) are already present from Phase 1
        - Append a live first-session entry after them documenting:
            - The state of the codebase as inherited and assessed
            - Key findings from the assessment
            - What the developer has decided to do next
            - Watch items (known risks, problem areas to address)
        - This live entry is NOT marked as reconstructed — it was written with
          full session context and developer input
        - Create HANDOFF.md from the live entry (protocols/log-format.md)
[ ] 6. Confirm the first task with the developer before writing any code
```

#### Phase 4 — Confirm and Begin

Only after Phases 1–3 are complete and the developer has confirmed the first task
should the agent write any code. From this point forward, standard session
protocols apply.

---


---
