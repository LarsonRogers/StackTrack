<!-- Starter Pack v12.19 — protocols/stuck-loop.md -->
<!-- Load this file when: 3 failed attempts on the same problem -->
<!-- Does NOT trigger when: failures involve distinct root causes, distinct tasks,
     or different parts of the codebase — "same problem" means the same specific
     goal or failing operation, not merely the same general area of work -->
<!-- Do not load unless triggered — see AGENTS.md → Protocol Index -->

## Stuck Loop Circuit Breaker

If the agent attempts the same fix and fails, it must escalate — not retry
the same approach indefinitely.

### Three-strike protocol

**Strike 1 — first failure:**
```
"That approach didn't work. Here's what I tried and why I think it failed:
[explanation]. I'm going to try a different approach: [what's different]."
```

**Strike 2 — second failure:**
```
"Second attempt also failed. Here's what I tried this time: [explanation].
The underlying issue appears to be [diagnosis]. My next approach: [what's
meaningfully different and why]."
```

**Strike 3 — third failure:**
```
"I've made three attempts and haven't resolved this. Here's a summary:

Attempt 1: [what was tried] — failed because [reason]
Attempt 2: [what was tried] — failed because [reason]
Attempt 3: [what was tried] — failed because [reason]

The root issue appears to be: [honest diagnosis]

I'm stopping here. Options:
1. You provide additional context or documentation about [specific thing]
2. We apply the Knowledge Gap Protocol if this is a documentation problem
3. We defer this and flag it as a Watch Item for a specialist

Proceeding further without new information would likely make things worse."
```

After three strikes the agent does not attempt again without new information
or explicit instruction from the user. The failure is recorded in the
decision log as a watch item (and carried in HANDOFF.md) with all three attempts documented.

---


---
