<!-- Starter Pack v12.19 — protocols/product-definition.md -->
<!-- Load this file when: first session on a new project (type B) where the user
     arrives with an idea rather than a codebase — especially when the user cannot
     answer stack questions or the folder is empty. -->
<!-- Does NOT trigger when: a codebase already exists (inherited protocol covers
     assessment), or the user arrives with a concrete technical spec and stack. -->
<!-- Do not load unless triggered — see AGENTS.md → Protocol Index -->

## Product Definition Protocol

Turns "I have an idea" into a buildable plan. Assume the user is a
non-developer with an idea and possibly an empty folder. **Never assume a
stack is inferable — there is nothing to infer from an idea. Recommend one.**

This protocol runs after audience detection and before placeholder inference
(it produces the values inference would otherwise look for).

### Step 1 — Elicit the idea (plain language)

Ask, conversationally, not as a form:
- What should this thing do, in one or two sentences?
- Who will use it — just you, a few people you know, or the public?
- Where do you picture using it — phone, computer, in a browser, somewhere else?
- Is there anything it absolutely must do on day one?
- Is there anything you specifically do NOT want it to do or become?
- Will it store or handle information about you or other people — and if
  so, who should be able to see it?

Stop when you can write the brief below without guessing AND Step 1b has
resolved the risky unknowns. Two to four exchanges is normal. Do not ask about
technology — that is your job.

### Step 1b — Pressure-test the idea (before the brief)

Run the **Requirement Pressure-Test** (protocols/requirements.md, PRODUCT lens)
before writing the brief: surface and resolve the high-leverage unknowns —
unstated assumptions, edge cases, conflicting wants, hidden dependencies, and
what "success" concretely means — so the brief captures what the user actually
needs, not just what they first said. Bounded and audience-scaled: a crisp idea
may pass with one or two questions (or none); a vague or ambitious one earns
more. Do not manufacture questions, and never grill a non-dev into a wall —
each question carries its "why." Accepted-but-unresolved risks become stated
assumptions in the brief.

### Step 2 — Write the product brief

Present for confirmation before anything else happens:

```markdown
## Product Brief — [working name]

**What it is:** [one sentence]
**Who it's for:** [user description]
**Where it runs:** [browser / desktop / phone — in user terms]

**MVP — the first working version does:**
1. [feature, in user terms]
2. [feature]
3. [feature — keep this list short; 3-5 items]

**Explicitly NOT in the MVP:**
- [tempting adjacent thing, deferred]
- [scaling/polish concern, deferred]

**Success looks like:** [the user can do X end-to-end and show it to someone]

**Data & trust (lightweight threat model):**
- Data handled: [what personal/sensitive data, if any — "none" is an answer]
- Who can touch it: [only the user / people with the link / the public]
- Worst credible misuse: [one sentence — what's the worst thing a stranger
  or a careless user could realistically do with this]
```

The threat-model answers drive how much of protocols/secure-coding.md
applies during build, and pre-answer the deployment protocol's
data-sensitivity gate. Keep them current: if the data model changes, the
brief changes.

"Confirm, or tell me what to change." Do not proceed unconfirmed.

### Step 3 — Recommend a stack

The agent chooses; the user approves. Requirements for the recommendation:

- Optimize for: fewest moving parts, local-first runnable (the run/demo
  protocol depends on it), mature tooling, and the agent's ability to
  verify its work (testable, well-documented)
- Present in plain English with a one-line WHY per choice — no jargon walls:
  "I recommend building this as a web page (works on your phone and computer,
  nothing to install) using [X] — it's widely used, which means fewer dead
  ends."
- Offer at most one alternative, only if there is a genuine trade-off the
  user should decide (e.g., "runs offline" vs "shareable by link")
- External services, accounts, or paid dependencies in the MVP stack require
  explicit flagging — they are default-policy confirm items

On confirmation: write the stack into AGENTS.md → Part 2 (Tech Stack,
Quick Constraints, Validation Commands — standard tools for the chosen
stack; mark # NOT CONFIGURED only for what genuinely has no command yet).

### Step 3b — Sketch the architecture (size it honestly, on day one)

Pick the **lowest rung that fits the brief** — structure is decided before
any code, and written down, not discovered by accident:

```
S1  single-file tool       one file, functions only — NO layers
                           (one job, no UI state, no storage beyond a file)
S2  simple client app      UI + logic module + storage module
                           (one-screen-ish UI, local data, single user)
S3  client + server        client UI / server API / service layer
                           (data crosses a network, or anyone else uses it)
S4  client + server + DB   + data layer + schema migrations
                           (multi-user, shared persistent data)
```

Rules:
- Layers exist where the brief demands them, never by ceremony — a
  200-line tool gets no controllers/services split, and a multi-user app
  with shared data does NOT skip the service and data layers.
- Every layer chosen gets one WHY line.
- Write the result into AGENTS.md → Part 2 → Project-Specific Architecture
  (structure + data flow) and Key Invariants (the dependency rules — these
  become the import-boundary contracts in enforcement-tooling row 4) —
  **on day one**, not "as architecture solidifies."

**Growth triggers — when any of these appears, the structure decision is
re-made and LOGGED (restructure now, or schedule it as a backlog item —
never silent drift):**

```
- authentication appears            → at least S3 separation; secure-coding applies
- second data entity, or shared
  multi-user persistent data        → S4: a real data layer, not ad-hoc writes
- second consumer (CLI + web,
  public API, another service)      → service layer extracted from UI/transport
- a file crosses ~300 lines or a
  module clearly does two jobs      → split within the current rung
```

A revisit updates the sketch, the Key Invariants, and the import-boundary
contracts in the same commit.

### Step 3c — Establish the tier map and pack profile (provider-agnostic)

Once the stack and provider/environment are known, set this project's tier
map (protocols/model-tiering.md) and pack profile (protocols/context-window.md)
so routing and context posture are configured before any work:

- Detect the provider/environment in use (the harness's configured models —
  Anthropic, OpenAI, Google, local Ollama, an internal gateway, etc.).
- Propose a pairing in plain English: a **Capable** model (the main/default
  model — never downgraded) and, if a cheaper/faster one is available on a
  compatible provider, a **Light** model for bounded rule-bound checks. Ask
  once.
- Single-tier is a valid answer: if the user has only one model, doesn't
  want to split, or skips, leave the map single-tier (everything runs
  Capable). It can be filled in later — no friction, no requirement.
- Also set the **Pack profile** and **Context budget** (same Part 2 block):
  FULL by default; LEAN when the target is a small-context or local model
  (≤~16k usable). LEAN trims resident footprint and checkpoints more often
  without relaxing any gate. State the budget (e.g. 8k / 32k / 200k) so
  cadence and protocol-loading scale to it.
- Write the result into AGENTS.md → Part 2 → Model Tiers (profile, budget,
  provider, and role → model → how-to-switch knob for this harness).

### Step 3d — Set the project stakes

Propose a stakes posture from the brief and confirm it (protocols/project-stakes.md)
— it scales how much process ceremony the build carries (tooling bundle, doc set,
test depth, demo formality), never the safety floor:

- **Spike** if the brief reads throwaway/local/exploratory with no real data;
  **Production** on clear signals (real users, real or sensitive data, money,
  deploy intent); otherwise **Standard** (the default).
- Propose, don't impose: "This looks like X — I suggest **[posture]** stakes;
  confirm or pick another." Default to Standard if unsure.
- Write it to AGENTS.md → Part 2 → Project Stakes. It governs Step 4's tooling
  and doc scope below.

### Step 4 — Seed the backlog

Create `BACKLOG.md` at the repo root:

```markdown
# Backlog — [project name]
<!-- Ordered list. Top item = next work. The agent updates status;
     order changes only with user agreement. One item ≈ one task brief. -->

| # | Item | What the user will be able to do after | Status |
|---|------|----------------------------------------|--------|
| 1 | [scaffold + hello-world run] | See the app start on their machine | pending |
| 2 | [first MVP feature] | [user-visible outcome] | pending |
| 3 | [next feature] | [outcome] | pending |
```

Rules:
- Item 1 is ALWAYS "get something minimal running end-to-end" — the walking
  skeleton the run/demo protocol can demonstrate. Features come after.
- Item 1 includes the enforcement-tooling setup
  (protocols/enforcement-tooling.md), scaled to the Project Stakes set in Step 3d:
  Spike = linter + secret hook; Standard = + format, type, tests, CI (boundary
  rules if the architecture has layers); Production = the full bundle. The secret
  hook is set up at every stakes level. Gates exist BEFORE the first feature.
- Docs for item 1 also scale with stakes: Spike = DECISION_LOG + HANDOFF (+ the
  architecture sketch, always); Standard/Production = + BACKLOG + RUNBOOK + full
  Part 2. (If Spike, this BACKLOG.md may be a short list rather than the full set.)
- Every item is phrased as a user-visible outcome, not a technical layer
  ("can add a note and see it saved", not "implement storage layer")
- Completing a backlog item triggers a FULL demo (protocols/run-demo.md)
- 5–10 items is plenty; the backlog is rewritten as understanding improves —
  it is a living document, not a contract

### Step 5 — Hand off to normal flow

- Record the brief and stack decision (with WHY) in the development log
- The first backlog item becomes the first task brief (TASK_TEMPLATE.md)
- From here, standard task workflow applies

### Done criteria for this protocol

```
[ ] Requirement pressure-test run (Step 1b) — risky unknowns resolved or
    recorded as stated assumptions
[ ] Product brief confirmed by the user (including the Data & trust block)
[ ] Stack recommended, explained in plain English, and confirmed
[ ] Architecture sketch sized (S1–S4) and written into Part 2 —
    structure, WHY per layer, Key Invariants
[ ] Model tier map set in Part 2 (single-tier is a valid answer)
[ ] Project Stakes set in Part 2 (Standard is the default; Spike/Production
    proposed from the brief and confirmed)
[ ] AGENTS.md Part 2 filled (summary, stack, quick constraints, commands)
[ ] BACKLOG.md created, item 1 is a runnable walking skeleton INCLUDING
    enforcement tooling (protocols/enforcement-tooling.md)
[ ] First task brief confirmed
```

---
