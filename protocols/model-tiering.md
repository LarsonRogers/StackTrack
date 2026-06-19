<!-- Starter Pack v12.19 — protocols/model-tiering.md -->
<!-- Load this file when: you are about to delegate a task to a sub-agent and
     must decide which model it runs on — a governance/watch check, a
     mechanical scan, or template-driven drafting. -->
<!-- Does NOT trigger when: the main agent does the work itself (it keeps the
     session model), or when a deterministic shell command settles the
     question (no model is involved at all). -->
<!-- Do not load unless triggered — see AGENTS.md → Protocol Index -->

## Model Tiering for Sub-Agents

Not every delegated task needs the strongest model. A bounded, rule-bound
check governed by an explicit rubric can run on a cheaper, faster model
without losing fidelity — but a judgment call dressed up as a checklist
cannot. This protocol decides which tier a sub-agent task runs on, so cost
is spent where judgment is needed and saved where it is not.

This is a cost optimization within already-bounded work, **not** a quality
shortcut. The safeguard is the selection rule below, not the model.

### The three tiers

```
DETERMINISTIC  — a script settles it; no LLM at all.
                 ls-vs-index, version grep, dead-link scan, YAML/JSON parse,
                 planted-secret scan, file-exists/path checks.
                 RULE: never spawn a sub-agent for what a command answers.

LIGHT          — bounded, rubric-driven sub-agent work with a mechanically
                 checkable output. Header/WHY-comment presence scans,
                 "every protocol has a trigger row," "every changed file has a
                 file header," template-driven DECISION_LOG/HANDOFF drafting,
                 mechanical reformatting, simple extraction/classification.
                 Model: the Light-tier model from the project's tier map
                 (the provider's cheaper/faster model — see Tier map below).

CAPABLE        — judgment and safety-critical work. Independent review
                 (protocols/review.md), secure-coding assessment, conflict
                 resolution, architecture-conformance judgement, anything
                 where a miss is a guardrail or correctness failure.
                 Model: the main session model. NEVER downgraded.
```

Tier names are by task property, not by model brand — they are capability
roles, deliberately provider-neutral. Two independent axes turn a role into
an actual model call:

- **Provider / environment** — *which models exist*: Anthropic, OpenAI,
  Google, a local Ollama host, an internal gateway, and so on. This decides
  the concrete model behind each role. **Access method matters as much as the
  provider:** the *same* provider can expose a *different set of usable model
  IDs* depending on how it is reached — an online/subscription login (OAuth)
  vs a direct API key vs a gateway. A model that exists "on OpenAI" may not be
  callable under the login this project actually uses (and this likely holds
  across providers). So treat the available models as a function of provider
  **and** auth path: when proposing a Light model, offer one the user's actual
  access path exposes — confirm the ID is reachable under their auth, or ask
  which cheaper model their login/key/gateway offers, rather than assuming a
  brand-name model string is available.
- **Harness** — *the knob that switches model*: Claude Code, OpenCode, Codex.
  This decides how a sub-agent is pointed at that model.

Both are project-specific, so the concrete mapping is NOT hardcoded in this
protocol — it lives in the **tier map** below, established once per project.

### Tier map (per project)

The capability roles are universal; the models filling them are not. At stack
selection the agent records this project's map in **AGENTS.md → Part 2 →
Model Tiers** — provider-neutral, filled with whatever this project actually
uses:

```
Provider / environment: [what this project uses]
Capable role  → [the session / default model]    (never downgraded)
Light role    → [a cheaper / faster model on a compatible provider]
Deterministic → none (script only)
```

Establishing it is a standard setup step, not a mandate:

- New project — product-definition Step 3c (right after the stack is chosen).
- Inherited project — inherited-codebase Phase 3 step 4c.
- The agent detects the provider, proposes a Light + Capable pairing, and
  asks once. If the user skips, or only one model is available, the map
  stays **single-tier**: every delegated task runs on the Capable / session
  model. Single-tier is always valid — tiering is a cost lever, never a
  requirement, and can be switched on later by filling in a Light model.
- In OpenCode and Codex, "filling in a Light model" means **predefining a
  Light-tier subagent file** pinned to that model (the pack ships a fill-the-model
  template per harness — see "Predefined Light-tier subagents" below) — there is
  no per-call selector to reach a cheaper model on the fly. In Claude Code either
  path works (predefined agent or per-call `model`).
- **Never leave the block silently blank.** Whenever a session finds the Part
  2 → Model Tiers block unset and it is needed — a new project, inherited
  onboarding, or just after a pack upgrade that introduced the block as NOT SET
  (protocols/upgrade.md) — the agent fills it *then*: detect the provider,
  propose a Light + Capable pairing, and ask once. If the provider exposes only
  one usable model, it may set **single-tier** automatically and note it. If the
  user declines a Light tier, record single-tier explicitly — write the Light
  row as `none — single-tier (decided YYYY-MM-DD)` so the always-on Session Start
  tier-map offer (AGENTS.md) treats it as resolved and never re-asks. A NOT-SET
  block is resolved at the first session that needs it, never carried forward
  unaddressed.
- **When a Light model is chosen, the agent activates it — it does not stop at
  recording the string.** It writes the live Light subagent file from the
  template and then tells the user whether a restart is required (see "Predefined
  Light-tier subagents" below). Prompting for the model, activating the template,
  and signalling restart are one continuous setup step, not three things the user
  must chase down. The same applies whenever a user later turns tiering on in a
  single-tier project.

A Light model is used only when the map actually defines one AND the
three-part gate below passes. No Light model in the map → every delegation is
Capable, automatically. This is what makes the policy safe under any provider:
absent or unknown configuration degrades to "run it on the main model," never
to "skip it" or "guess a cheaper model."

The same Part 2 → Model Tiers block also records the **Pack profile** and
**Context budget** (FULL / LEAN) — these govern resident footprint and
checkpoint cadence, a separate concern from sub-agent model choice, defined in
protocols/context-window.md. They are set together at stack selection.

### Selection rule — the three-part gate

Route a task to the **Light** tier only when ALL THREE hold:

```
[ ] (a) An explicit rubric or checklist governs the task — the sub-agent is
        applying stated rules, not forming an opinion.
[ ] (b) The output is mechanically checkable — a list, a yes/no per item, a
        diff — something the caller can spot-verify without re-judging.
[ ] (c) A wrong answer is caught downstream — by a Capable-tier review, a
        deterministic gate, or the human demo — before it can cause harm.
        For anything feeding a guardrail-adjacent or safety decision, (c)
        must be a deterministic gate or a Capable-tier check: a human demo
        alone does not qualify, since a non-dev demo is not a defect backstop.
```

If any one fails → **Capable** tier. When unsure which side a task is on,
treat it as Capable: the cost of an over-strong model is money; the cost of
an under-strong watchdog is a missed defect.

### Never downgraded (hard list)

These always run on the Capable tier, regardless of how rule-bound they look:

```
- Independent review (protocols/review.md) — the reviewer is the safety net;
  a cheap reviewer that misses a blocker defeats the gate's entire purpose.
- Secure-coding assessment (protocols/secure-coding.md).
- Conflict resolution / instruction-precedence calls.
- Architecture-conformance and growth-trigger judgement.
- Any hard-guardrail decision.
```

### Honesty — record the tier

When a Light-tier sub-agent produces a result that feeds a decision or a log
entry, note the tier used (e.g. "header scan — Light tier"). A Light-tier
result must never be presented as if a Capable-tier agent vetted it — same
principle as the "could not verify" list in review.md: silence about the
level of scrutiny reads as more scrutiny than was applied.

Light-tier delegation is a **silent default** — the agent may route a
qualifying task to the Light tier without asking — but the tier is logged
wherever the result is recorded. Routing to the Light tier never changes
*what* work is done or *which* guardrails apply; it changes only which model
executes a downstream-checked scan. It is never license to self-delegate
guardrail-adjacent work — that is governed by AGENTS.md Part 1, unchanged.

### Surfacing Light-tier use to the user (opt-in)

Logging the tier (above) is the always-on honesty record — it lives in the
DECISION_LOG and is developer-facing. Separately, the user may opt in to a
**running, user-facing notice** so they can see how often work is routed to the
cheaper model.

- **The preference** lives in AGENTS.md → Part 2 → Model Tiers → `Tier-use
  reporting` (`on` / `off` / `n/a — single-tier`). Default is **off** until set;
  tier *logging* is unaffected either way.
- **Ask once, at tier setup** (activation step 2b below) — and only when a Light
  model is actually configured. A single-tier project never uses a lower tier, so
  set the field `n/a — single-tier` and ask nothing. The one-line question:
  "Want me to note in each work summary when I used the cheaper [Light model] for
  a sub-task, so you can see how often that happens?" Record the answer as
  `on (decided YYYY-MM-DD)` / `off (decided YYYY-MM-DD)`.
- **When `on`:** if one or more sub-tasks ran on the Light tier during a prompt,
  append a single line to that prompt's work summary naming the count and the
  tasks — e.g. "Model-tier note: 2 sub-task(s) on the Light tier this turn —
  header-comment scan, HANDOFF draft." If none ran this turn, say nothing
  (silence = none; do not emit a zero line every turn). Scale wording to the
  audience mode like any other summary line (protocols/communication.md).
- **When `off` / `n/a`:** no work-summary note; the DECISION_LOG tier record is
  the only trace, exactly as before.

This is surfacing only — it never changes which tier a task is routed to, what
work is done, or which guardrails apply.

### The switch — harness mechanism

The tier map says *which* model fills each role; this section is *how* you
point a sub-agent at it. There are two distinct mechanisms, and only one is
portable across all three harnesses — do not assume they are interchangeable:

- **Per-definition (all three harnesses):** pin a model inside a *named
  subagent's definition*, then route work to that agent by name. This is the
  portable pattern. To tier in OpenCode or Codex you **predefine** a
  tier-specific subagent (e.g. a `light-checker` pinned to the cheaper model)
  and invoke it — the model is chosen when the agent is defined, not at the
  moment of delegation.
- **Per-call (Claude Code only):** choose a cheaper model *dynamically at spawn
  time* without a predefined agent. Convenient, but it does **not** exist in
  OpenCode or Codex. Their docs expose no per-invocation model selector, and an
  agent reporting "no per-call model selector" is correct, not misconfigured.

The portable rule: **define the tier agents up front; treat per-call override
as a Claude-Code-only convenience.** The model string each definition takes
comes straight from the tier map, so a non-Anthropic provider is just a
different string in the same field (`openai/…`, `google/…`, `ollama/…`), not a
different mechanism. All three inherit the parent/session model when no model is
set, so tiering stays opt-in. Record the exact path for this project in the Part
2 tier map's "How to switch" column.

```
Claude Code  — BOTH paths. Per-definition: `model:` in a subagent's
               `.claude/agents/*.md` frontmatter (alias haiku/sonnet/opus/fable,
               a full model ID, or `inherit`). Per-call: pass `model` when
               spawning via the Agent/Task tool. Resolution order is
               CLAUDE_CODE_SUBAGENT_MODEL env var → per-call param → frontmatter
               → main model; omit everywhere → inherit. (Enterprise policy may
               restrict models via an allowlist; a blocked request falls back,
               it does not fail.)

OpenCode     — Per-definition ONLY. Pin `"model": "provider/model-id"` on a
               subagent declared with `"mode": "subagent"`, then invoke it by
               name / @mention. Prefer a markdown agent file
               (`.opencode/agent/*.md` frontmatter) over an `opencode.json`
               entry: a subagent listed in opencode.json can be mis-treated as a
               primary agent, ignoring `mode: subagent` (OpenCode issue #22130,
               open as of 2026-06). No per-call selector (issue #6651, open
               feature request). Omit model → inherits the invoking agent's.

Codex        — Per-definition ONLY. Define the subagent as a TOML file in
               `.codex/agents/*.toml` (or `~/.codex/agents/`) with `model` and
               optional `model_reasoning_effort`; required fields are name /
               description / developer_instructions. Models are fixed per file,
               not selectable per call; omitted fields inherit the parent
               session. (No global default-subagent-model setting yet — Codex
               issue #19482; set the model on each agent file.)

Other / SDK  — Any harness or SDK exposing a per-agent model field (or, more
               rarely, a per-call parameter) works the same way: put the
               tier-map model string there. No such field → single-tier
               (everything Capable).
```

If a harness cannot route a given task to the cheaper model — no per-call knob
and no predefined tier agent — run it on the Capable model rather than skip it.
Tiering lowers cost where the mechanism exists; it never lowers coverage.

### Predefined Light-tier subagents (shipped templates)

Because OpenCode and Codex have no per-call selector, tiering there needs a
*named subagent pinned to the Light model*. The pack ships one ready to fill, per
harness — each is a read-only, rubric-only scanner (no edit permission) whose
description is scoped to bounded checklist work, so the primary delegates Light
scans to it and nothing else:

```
.claude/agents/light-checker.md.example     model: haiku  (already valid; edit only to match your map)
.opencode/agent/light-checker.md.example    model: REPLACE_WITH/your-light-model-id   → restart OpenCode
.codex/agents/light-checker.toml.example    model: REPLACE_WITH_your_light_model       → restart Codex
```

**The agent drives activation; the user never edits these files by hand.** The
user makes one decision (which Light model) and, for OpenCode/Codex, performs one
action only it can do (restart the harness). Everything between is the agent's:

```
[ ] 1. PROMPT for the model — propose a Light + Capable pairing for the detected
        provider and ask once. (Skip/one model available → single-tier; done.)
[ ] 2. RECORD it in the Part 2 → Model Tiers map.
[ ] 2b. ASK once whether to report Light-tier use in the work summary (now that a
        Light tier exists — see "Surfacing Light-tier use to the user" above) and
        record `Tier-use reporting` in the Model Tiers block. (Single-tier projects
        never reach this step — their field is set `n/a — single-tier` when the
        tier map is resolved.)
[ ] 3. ACTIVATE the template — the agent itself writes the live agent file from
        this harness's light-checker.*.example: copy it to its live name (drop
        `.example`) and set `model` to the chosen string. The user does not open
        or edit the file. (Claude Code's `haiku` default needs no model edit.)
[ ] 4. INDICATE RESTART — state plainly whether the harness must reload, because
        the new agent is unavailable until it does and the agent cannot restart
        its own harness:
          OpenCode    → "Restart OpenCode — it loads agents at startup."
          Codex       → "Restart Codex — it loads agents at startup."
          Claude Code → "No harness restart — but the agent appears only in a
                         NEW session, not the current one; start one to use it."
[ ] 5. CONFIRM invocation after reload — verify the primary delegates a bounded
        scan to the Light agent (@mention or description-match; there is no
        by-name model-override tool). If it cannot be invoked, run the check on
        the Capable tier rather than skipping it (fail-safe unchanged).
```

Until activated, the templates are inert — the `.example` suffix means no harness
loads them, so every delegation runs Capable (single-tier, always valid). This is
the artifact behind the tier map: the map names the model; the agent file is what
the harness actually invokes — and the agent, not the user, creates it.

The live agent file (`.opencode/agent/light-checker.md` etc., `.example` dropped)
is **project config — commit it** so the tier persists for the whole team. Only
this pack-development repo keeps its own dogfood copy out of git (via
`.git/info/exclude`, local and never shipped) to avoid distributing a personal
model choice in the template.
