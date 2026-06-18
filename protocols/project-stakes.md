<!-- Starter Pack v12.16 — protocols/project-stakes.md -->
<!-- Load this file when: setting up a project (product-definition or inherited
     onboarding) and choosing how much process ceremony it warrants, or when a
     stakes-scaled step runs (enforcement-tooling bundle, doc set, test depth,
     demo formality), or when a Spike's escalation trigger fires. -->
<!-- Do not load unless triggered — see AGENTS.md → Protocol Index -->

## Project Stakes

The pack already sizes **architecture** (product-definition S1–S4) and **context
footprint** (Pack profile FULL/LEAN). This is the third dial: how much **process
ceremony** the project warrants. It scales the *expensive* apparatus — tooling
setup, doc volume, test depth, demo formality — and **never the safety floor**.

Same principle as LEAN: trim *footprint*, not *discipline*. A throwaway spike
should not carry production CI and a five-document trail; a production system
must. One dial, set once, makes that proportional instead of uniform.

### The three postures

```
SPIKE       — a throwaway / exploration / proof-of-concept. Local, short-lived,
              not shared, no real data. Optimized for speed of learning.
STANDARD    — the default. A real project a few people rely on; lives a while,
              gets extended. The sensible middle.
PRODUCTION  — shipped, shared, or handling real/sensitive data or money. Failure
              is costly. Maximum mechanical rigor.
```

### What scales — and what is floor

| | SPIKE | STANDARD (default) | PRODUCTION |
|---|---|---|---|
| **Enforcement gates** (protocols/enforcement-tooling.md) | linter + secret hook | + formatter, type check, tests, CI; import-boundary rules if the architecture has layers | + dependabot, SAST/semgrep, strict import-boundaries |
| **Docs** | DECISION_LOG + HANDOFF + the day-one architecture sketch | + BACKLOG, RUNBOOK, full Part 2 fill | same as Standard |
| **Tests** (protocols/testing-strategy.md) | smoke / happy-path | behaviour tests + critical-path coverage floor | + failure-mode tests + full coverage floor |
| **Demo formality** (protocols/run-demo.md) | "here's it running" once | quick re-confirm; FULL demo on backlog-item completion | FULL demo always |

The columns are cumulative (`+` = adds to the column on its left). The **secret
hook is floor**, not a Spike-only line item — it is present at every posture even
though only the Spike cell names it; same for everything in the floor list below.

**Floor — present at EVERY posture, never scaled away (identical to today):**

```
- Secrets handling AND the pre-commit secret hook (enforcement-tooling gate 5).
  The secret hook is floor, not ceremony — it guards a hard guardrail and fires
  even on a Spike.
- Parameterized queries / output encoding, and the secure-coding self-check
  whenever a task touches input, auth, sessions, or stored data.
- Independent review when its trigger fires (backlog-item completion, pre-deploy)
  — never self-waived, never downgraded by stakes.
- The day-one architecture sketch (S1–S4 sizing + Key Invariants). Cheapest,
  highest-value mechanism in the pack — kept at all stakes, including Spike.
- "Don't commit broken state" + one DECISION_LOG entry per task.
```

Stakes lowers how much *optional production apparatus* is built; it never lowers
what keeps the project safe or recoverable.

### Setting it

- **Default is STANDARD.** Spike and Production are **proposed and confirmed**,
  never auto-selected — no project silently gets less rigor.
- The agent proposes a posture from the brief, the way it proposes the S-rung:
  "This looks like a local throwaway — I suggest **Spike** stakes (lighter
  tooling, minimal docs); or **Standard** if you'll keep building on it. Which?"
  Clearly-serious signals (real users, real/sensitive data, money, deploy intent)
  → propose **Production**.
- New project: product-definition (alongside the architecture sketch). Inherited:
  inherited-codebase Phase 3 (alongside the tier map). Recorded in **AGENTS.md →
  Part 2 → Project Stakes**.

### Escalation (a Spike cannot quietly become real)

A Spike **ratchets up to Standard or Production — logged — the moment any of
these appears** (mirrors the S1–S4 growth triggers):

```
- it starts handling real or other people's data
- authentication / access control is added
- it is about to be deployed, shared, or published
- people start relying on it beyond the original throwaway use
```

On escalation, set up the gates/docs/tests the new posture requires *then*, and
record the change in the decision log. Stakes only ratchets **up** automatically;
moving down is an explicit, logged user decision.
