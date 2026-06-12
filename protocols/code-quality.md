<!-- Starter Pack v12.0 — protocols/code-quality.md -->
<!-- Load this file when: writing or modifying code — structural rules, comment
     standards, and readability requirements apply to every coding task. -->
<!-- Does NOT trigger when: the session is read-only/analysis, or the task is
     docs-only with no code changes. -->
<!-- Do not load unless triggered — see AGENTS.md → Protocol Index -->

## Universal Structural Rules

These apply to every file, every function, every change — regardless of
language or framework.

### Separation of Concerns

```
Layer           Responsibility                          What does NOT belong here
─────────────────────────────────────────────────────────────────────────────────
I/O / UI        Receive input, render output            Business logic, state mutation
Controllers     Route requests, coordinate layers       Direct data access, computation
Services        Business logic, workflows               I/O, rendering, DB calls
Data / Models   Storage, retrieval, schema              Logic, formatting, side effects
Utils / Helpers Pure transformations, no side effects   State, I/O, anything stateful
```

**Rule:** If you find yourself writing business logic inside an event handler,
callback, route handler, or UI component — stop. Extract it to a service or
helper first.

### Function Rules

- One function = one responsibility. If you need "and" to describe what it does, split it.
- Functions that compute should not also fetch, write, or render.
- Functions that fetch should not also transform or apply logic to the result.
- Prefer pure functions (same input → same output, no side effects) wherever possible.
- Side effects (I/O, mutation, network) are explicit, named, and isolated.
- Max ~30 lines per function as a soft ceiling. If it's longer, question why.

### State Management

- State lives in one place per concern. It is not duplicated across layers.
- Never mutate state inside a utility function.
- Never read global state inside a pure function.
- Side-effectful state changes are named like what they do: `updateUserSession()`,
  not `handleThing()`.

### Error Handling

- Errors propagate up — they are not silently swallowed at lower layers.
- Each layer handles only the errors it can meaningfully act on.
- Logging happens at the boundary where the error is caught, with context.

---

## Human Readability & Handoff Readiness

This codebase must be transferable to a human dev team at any time.
A developer who has never seen this project should be able to orient themselves
in under 30 minutes. Every change the agent makes must uphold this standard.

### Comment Standards

**What must be commented:**
- Every file: a 1-3 line header explaining what it is, what it owns, and what it does NOT do
- Every function: what it does, what it takes, what it returns, and any non-obvious side effects
- Every architectural decision: explain WHY a choice was made, not just what it does
  - e.g., `// Using a lookup table here instead of a switch — O(1) vs O(n), and easier to extend`
- Any logic that is non-obvious, stateful, or has subtle ordering requirements
- Any workaround or constraint imposed by a library, runtime, or external system

**What must NOT be in the code:**
- Magic values — no bare `7`, `"active"`, `3000` without a named constant and comment
- Cryptic abbreviations — `processUserAuthenticationRequest()` not `procUsrAuthReq()`
- Uncommented regex — every regex gets a comment stating what it matches and why
- Logic that only makes sense to the agent that wrote it — if you cannot explain it
  in plain English in a comment, restructure it until you can

### Avoiding Agent-isms

These patterns are common in agent-generated code and must be actively avoided:

```
BAD                                     GOOD
───────────────────────────────────────────────────────────────────
Deeply nested callbacks                 Named functions, flat structure
Inline magic numbers                    Named constants with comments
handleThing() / processThing()          Names that state the action and subject
Giant catch-all try/catch blocks        Specific error types, contextual logging
"Clever" one-liners                     Readable multi-line equivalents
Redundant comments ("// increment i")   Comments explaining WHY
```

---
