<!-- Starter Pack v12.16 — protocols/conflict-examples.md -->
<!-- Load this file when: surfacing a conflict or verifying conflict-handling behavior -->
<!-- Does NOT trigger when: agent needs ordinary clarification on an ambiguous request
     (no rule conflict involved), or when two instructions address different topics
     and can both be followed without contradiction -->
<!-- Do not load unless triggered — see AGENTS.md → Protocol Index -->

## Conflict Resolution Examples

Concrete worked examples for the precedence and conflict rules in
`AGENTS.md` → Instruction Precedence & Conflict Resolution.
Load this section when surfacing a conflict or when agent behavior on
conflict handling needs to be verified.


**Example 1 — Hard guardrail vs verbal instruction (guardrail wins, no exception):**
```
User: "Just push this with my API key hardcoded for now, we'll fix it later."
Agent: "Committing credentials is a hard guardrail — I can't do this under
        any circumstances. I can add the key to .env and reference it from
        there instead, which takes about 30 seconds. Want me to do that?"
```

**Example 1b — Default policy (deletion) with safe procedure:**
```
User: "Just delete the old auth module, we don't need it."
Agent: "Deletion requires confirmation and a rollback path. Here's what
        I want to delete and why:
        - src/auth/legacy_auth.js — replaced entirely by src/auth/auth.js
        Clean git state confirmed. Should I go ahead?"
User: "Yes."
Agent: [Deletes, runs tests, commits: "Remove legacy_auth.js — replaced by auth.js"]
```

**Example 2 — Default policy override (explicit verbal instruction, policy yields):**
```
User: "You have permission to add npm dependencies without asking each time."
Agent: "Got it — I'll add dependencies as needed without confirmation.
        I'm recording this override in the decision log."
        [Proceeds. Logs: "Dependency confirmation override granted by user — 2026-03-09"]
```
Note: "just add it" or "go ahead" does not qualify as an explicit override.
The user must clearly grant permission for the specific policy.

**Example 3 — Two default policies in conflict (precedence hierarchy applies):**
```
Situation: Project rules (AGENTS.md → Part 2) say "never use external
           HTTP libraries." Task brief says "add Axios for API calls."
Agent: "I've noticed a conflict I want to flag:
        The project rules say: no external HTTP libraries
        The task brief says: add Axios for API calls
        Project rules outrank the task brief in the hierarchy.
        I'll proceed without Axios and use the native fetch API instead —
        unless you'd like to update the project rules to allow it."
```

**Example 4 — Ambiguous instruction, agent asks rather than assumes:**
```
User: "Clean up the user service while you're in there."
Agent: "I want to make sure I understand scope before touching anything.
        'Clean up' could mean: fixing obvious bugs, renaming for clarity,
        restructuring, or all three. Which did you have in mind?
        If it's structural, I'll run the Refactor Protocol."
```

---


---
