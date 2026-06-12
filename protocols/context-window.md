<!-- Starter Pack v12.0 — protocols/context-window.md -->
<!-- Load this file when: 5+ tasks in session or detected context degradation -->
<!-- Do not load unless triggered — see AGENTS.md → Protocol Index -->

### Context Window Management

Long sessions accumulate context until the agent begins losing track of earlier
instructions, decisions, and constraints. This degrades output quality silently
— the agent won't announce it's forgetting things.

### When this protocol triggers

Triggers when any of these are true:
- 5 or more tasks completed in the current session
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
- 5 or more tasks have been completed in the current session, OR
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
