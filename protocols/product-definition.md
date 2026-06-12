<!-- Starter Pack v12.0 — protocols/product-definition.md -->
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

Stop when you can write the brief below without guessing. Two to four
exchanges is normal. Do not ask about technology — that is your job.

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
```

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
[ ] Product brief confirmed by the user
[ ] Stack recommended, explained in plain English, and confirmed
[ ] AGENTS.md Part 2 filled (summary, stack, quick constraints, commands)
[ ] BACKLOG.md created, item 1 is a runnable walking skeleton
[ ] First task brief confirmed
```

---
