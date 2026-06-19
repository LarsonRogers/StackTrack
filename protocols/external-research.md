<!-- Starter Pack v12.19 — protocols/external-research.md -->
<!-- Load this file when: external SDK, API, or platform work; or web access unavailable (Knowledge Gap) -->
<!-- Do not load unless triggered — see AGENTS.md → Protocol Index -->

## External Research Protocol

Before writing any code that involves an external system, SDK, API, framework,
or platform the agent is not verified-current on, the agent must research it first.
"Verified-current" means: the version, behavior, or API surface was explicitly
confirmed in the current session (via research, user statement, or docs) or is
recorded in the decision log from a prior session — provided the logged version
or API surface has not changed since that entry (if uncertain, re-verify).
Training data alone does not count as verified-current.
Do not rely on training data alone — it may be stale, incomplete, or wrong.
This is especially critical for niche, underdocumented, or version-sensitive systems.

### When This Triggers

Research is required any time the task involves:
- A third-party SDK, API, or library where behavior is version-sensitive,
  undocumented, or behavior-critical (routine well-known dependencies with
  stable APIs do not require research — e.g., adding lodash to a JS project)
- A platform with its own scripting or plugin model (DAWs, hardware controllers,
  game engines, creative tools, etc.)
- A framework where version differences affect behavior
- Any system where the agent's training knowledge cannot be independently verified
  or may be outdated
- Hardware-software integration where protocol details matter

Does NOT trigger for: widely-used stable libraries where the required usage
is standard and the version has been explicitly confirmed this session or in
a prior decision log entry with no known breaking changes since that entry
(e.g., standard stdlib usage, well-known utility libraries with unchanged APIs).

### Research Steps

```
[ ] 1. Identify every external system relevant to the task
[ ] 2. For each system, search for:
        - Official documentation and SDK references
        - Source repos (GitHub, GitLab, etc.) — read actual code, not just docs
        - Known version constraints or breaking changes
        - Community resources: forums, issues, known workarounds
        - Any existing open-source implementations of similar problems
[ ] 3. Cross-reference findings — if sources conflict, flag it
[ ] 4. Document what was found before writing any code (see below)
[ ] 5. Flag anything that could not be verified — do not silently assume
```

### Knowledge Gap Protocol

If the agent encounters a task that requires knowledge of an external system,
SDK, API, or platform and:
- Web access is unavailable, AND
- The agent's training data on the subject is absent, sparse, outdated, or
  unverifiable

The agent must **not guess or proceed on assumptions.** Instead it must
explicitly declare a knowledge gap and offer the user a path forward.

#### Step 1 — Declare the gap honestly

```
"I don't have reliable information about [system/API/tool]. My training data
on this may be outdated or incomplete, and I don't have web access to verify
it right now. Proceeding without accurate documentation risks producing code
that won't work or could break things."
```

Never frame a knowledge gap as confidence. If the agent isn't sure, it says so.

#### Step 2 — Offer three options

Present these options to the user:

```
I can continue in one of three ways:

1. You find the documentation — point me to the relevant docs, paste in
   key sections, or share a link I can read, and I'll use that to proceed
   accurately.

2. I generate a research prompt for you — I'll write a prompt you can paste
   into Claude.ai, ChatGPT, Perplexity, or any web-enabled AI. It will ask
   that AI to compile the specific documentation and examples I need. You
   copy the response back here and I'll use it.

3. I proceed with what I know, clearly flagged — I'll note every assumption
   I'm making and mark those sections of code with a warning comment so you
   or a developer can verify them later. Only choose this if the stakes are
   low and you want to move quickly.
   Note: this option is only available when you select it explicitly. The
   agent may not choose option 3 on its own — doing so would violate the
   hard guardrail on unverified external-system code in AGENTS.md.

Which would you prefer?
```

#### Step 3 — Generate the research prompt (if option 2 chosen)

The generated prompt must be specific enough that a web-enabled AI can compile
exactly what is needed. It should include:

```
## Research Prompt — [System/Topic] — for [Claude.ai / ChatGPT / Perplexity]

I'm working on a coding project that involves [brief plain-English description
of what the project does and what problem needs solving].

I need comprehensive, accurate, and current documentation on the following:

**System:** [Name and version if known]

**Specific questions:**
1. [Precise technical question — e.g., "What Python classes and methods are
   available in Ableton Live's Remote Script API for handling MIDI input?"]
2. [Next question]
3. [Next question]

**What to include in your response:**
- Official API methods, classes, and their signatures
- Known version differences or constraints
- Working code examples where available
- Links to authoritative sources (official docs, maintained repos, etc.)
- Any known gotchas, limitations, or common mistakes

**Format:** Please structure your response so it can be copied directly into
a coding session as a reference document. Use headers and code blocks.

[Optional: paste any relevant existing code here so the AI can tailor
its response to the specific context]
```

After generating the prompt, the agent tells the user:
```
"Copy that prompt and paste it into [Claude.ai / ChatGPT / Perplexity].
When you get the response, paste it back here and I'll use it to continue."
```

#### Step 4 — Receive and use the research

When the user pastes back the compiled documentation:
- Read it fully before proceeding
- Record the source and key findings in the decision log under
  "External research conducted"
- Flag any gaps or conflicts in the pasted docs before writing code
- Proceed with the Pre-Edit Protocol as normal

#### Flagging assumed code (option 3)

If the user chooses to proceed on assumptions, every block of code written
without verified documentation must be marked:

```python
# ⚠️ UNVERIFIED — written without confirmed documentation for [system/API].
# Assumption: [what was assumed]
# Verify before relying on this in production.
```

These markers must be resolved — either verified and removed, or corrected —
before the task can be considered complete.

---

### Platform-Specific Access

Agents handle web research differently — use whatever is available:

| Agent | Web access |
|-------|-----------|
| Claude Code | `WebSearch` tool (already permitted in settings.json) |
| Codex | Built-in web access if enabled; otherwise request docs from developer |
| OpenCode | `webfetch` tool (permitted in opencode.json) |
| Any agent | If web access is unavailable, explicitly list what docs are needed and ask |

If an agent has no web access and cannot verify external APIs or SDKs,
it must say so clearly and ask the developer to supply the relevant documentation
before proceeding. Do not guess at undocumented or version-sensitive behavior.

### Dependency & Security Hygiene

When adding or updating any dependency:
- Update the lockfile in the same commit (`package-lock.json`, `yarn.lock`,
  `Pipfile.lock`, `Cargo.lock`, etc.) — never commit a dependency change without it
- Run a dependency audit before committing:
  ```bash
  npm audit --audit-level=high   # Node
  pip-audit                      # Python
  cargo audit                    # Rust
  ```
- Document the new dependency in the decision log — name, version, purpose,
  and any security considerations
- Never introduce a dependency with known high/critical vulnerabilities
- Check the LICENSE at add time: permissive (MIT/BSD/Apache-2.0/ISC) →
  proceed; copyleft (GPL/AGPL/SSPL) or unknown → confirm with the user
  before adding — it constrains what they can do with their own product
- Update cadence: dependabot is templated in `.github/dependabot.yml`
  (ecosystem set during enforcement-tooling); where dependabot is
  unavailable, review outdated/advisory reports monthly and log security
  advisories on direct dependencies as watch items

When introducing a new external service or API:
- Document it in the decision log under External Research
- Note authentication method, data sensitivity, and any rate limits
- Never hardcode credentials — use environment variables

---

### Documenting Research

Findings must be recorded in the DECISION_LOG.md entry for the session:

```markdown
**External research conducted:**
- [System/SDK name] vX.X — [source URL or repo]
  Key findings: [what was confirmed, what version constraints apply]
  Gaps / unverified: [anything that could not be confirmed]
```

This ensures the next agent session — and any human developer — knows what
sources the code was based on and where assumptions were made.

---
