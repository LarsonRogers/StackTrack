<!-- Starter Pack v12.16 — protocols/context-window.md -->
<!-- Load this file when: 5+ tasks in session or detected context degradation -->
<!-- Do not load unless triggered — see AGENTS.md → Protocol Index -->

### Context Window Management

Long sessions accumulate context until the agent begins losing track of earlier
instructions, decisions, and constraints. This degrades output quality silently
— the agent won't announce it's forgetting things.

### Pack profile (FULL / LEAN)

Set in AGENTS.md → Part 2 → Model Tiers (**Pack profile** + **Context budget**),
at stack selection. It tunes how aggressively the session manages context —
**it never changes which guardrails, the Definition of Done, secure-coding, or
the independent review apply. Safety and correctness gates are identical in
both profiles.** LEAN reduces *resident footprint and optional richness*, not
the floor of required discipline.

```
FULL (default — frontier models, or local with ≥~32k context)
  - Load triggered protocols normally.
  - Checkpoint at 5 tasks (or on degradation).
  - Part 2 carries the full architecture sketch + Pattern Registry.

LEAN (small-context / local, ≤~16k context budget)
  - Load ONLY the protocol the current step strictly needs; defer optional
    ones (e.g. don't pull code-quality detail until actually writing code).
    The router still fires for every safety-critical trigger.
  - Checkpoint at 2–3 tasks — a smaller window fills faster, so externalize
    to HANDOFF.md/DECISION_LOG.md sooner and restart cheaper.
  - Part 2 collapses the architecture sketch + Pattern Registry to one-line
    pointers into DECISION_LOG.md (the detail lives there; the floor stays
    minimal). A cold agent reads the log when it needs that depth.
  - Prefer one logical change per session, then a fresh restart.
```

If the profile is unset, treat it as FULL. Choosing LEAN is a context-budget
decision, never a license to skip a gate.

### When this protocol triggers

Triggers when any of these are true:
- The profile's task threshold is reached — FULL: 5 tasks; LEAN: 2–3 (see
  Pack profile above)
- Agent re-asks a question already answered this session
- Agent proposes a change contradicting a confirmed decision
- Agent re-reads a file it already summarized without new prompting
- User reports confusion or inconsistency

Does NOT trigger when:
- Session is short (1–2 tasks) with no degradation signals
- Agent asks a clarifying question about a new task (normal behavior,
  not a sign of context loss)
- User changes direction or scope mid-session (intentional, not degradation)
- Agent re-reads a file for deeper analysis of the current task (legitimate
  deep-dive, not a sign of context loss — only counts as a degradation signal
  if the agent re-reads without apparent reason or repeats a summary it already gave)

### Proactive checkpointing

The agent must monitor session length and trigger a checkpoint when:
- The profile's task threshold is reached (FULL: 5; LEAN: 2–3), OR
- The session has been running long and the agent notices it is losing
  track of earlier context, OR
- The user reports the agent seems confused or inconsistent

### Checkpoint procedure

When a checkpoint is triggered:
```
[ ] 1. Complete the current task fully (do not checkpoint mid-task)
[ ] 2. Run the full Definition of Done checklist
[ ] 3. Append a DECISION_LOG.md checkpoint entry and overwrite HANDOFF.md with:
        - All tasks completed this session
        - Current codebase state
        - Confirmed next task
        - Handoff prompt for next session
[ ] 4. Notify the user:
        "This session is getting long and I want to make sure nothing gets
        lost. I've saved a full checkpoint — [summary of what was done].
        I'd recommend starting a fresh session for the next task to keep
        things sharp. HANDOFF.md has everything needed to resume."
[ ] 5. Do not start any new tasks after the checkpoint notification
```

The user may choose to continue anyway — that is their call. The agent
notes the choice in the log and continues with reduced confidence warnings
if it detects context degradation.

---


---
