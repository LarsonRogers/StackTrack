<!-- Starter Pack v12.16 — protocols/review.md -->
<!-- Load this file when: a backlog item is completed (review runs BEFORE its
     full demo), before any deployment, or when the user asks for a review
     of recent work. -->
<!-- Does NOT trigger when: closing ordinary tasks inside a backlog item —
     the per-task DoD covers those; review is the item-level gate. -->
<!-- Do not load unless triggered — see AGENTS.md → Protocol Index -->

## Independent Review Protocol

The agent that wrote the code is the wrong reviewer for it: the author's
context defends its own choices. This protocol forces distance — the review
runs against **artifacts** (the diff, the standards), never against the
author's memory of what it meant to do.

### When

- **Backlog-item completion** — the review runs BEFORE the item's full demo
  (protocols/run-demo.md). The demo gate does not open until the review
  verdict is recorded with zero unresolved blockers.
- **Before any deployment** — over the whole deployable surface (diff since
  the last review, or the full app if never reviewed).
- On user request.

Not per-task: tasks inside an item are covered by the per-task DoD; review
is the item-level gate. (Cost scales with items, not with every commit.)

### Mechanism — fresh context, harness-aware

**Claude Code:** spawn a subagent whose input is ONLY: AGENTS.md, the
item's diff (`git diff <item-start>..HEAD`), the touched files, and the
checklist below — explicitly NOT the session conversation.

The reviewer runs on the **Capable tier** and is never downgraded to save
cost (protocols/model-tiering.md → "never downgraded"): a cheap reviewer
that misses a blocker defeats the gate's entire purpose.

**Codex / OpenCode / any agent (portable fallback):** diff-only discipline.
A fresh session if practical; otherwise, in-session: re-read only the diff,
the touched files, and AGENTS.md Part 2 (sketch, invariants, patterns), and
evaluate each checklist item against what the artifacts show — explicitly
disregarding what you remember intending. Every verdict must cite the diff
(`file:line`), not the intention. A verdict that cannot cite the artifact
is not a verdict.

### The four dimensions

```
1. CORRECTNESS — does the diff actually deliver the backlog item's
   user-visible outcome; are edge cases and error paths handled
   (testing-strategy standards); do the tests verify behavior, not echo
   the implementation?
2. SECURITY — apply every secure-coding checklist section the diff
   touches (input, queries, authz/IDOR, sessions, output, paths, errors).
3. ARCHITECTURE — does the diff respect the Part 2 sketch and Key
   Invariants; did a growth trigger fire in this item that was not
   logged; any boundary crossed silently?
4. READABILITY — code-quality standards: file headers, WHY comments,
   named constants, honest naming, no agent-isms; would a cold human
   developer follow this?
```

### Verdict format (recorded, in the decision log entry for the item)

```
## Review — [backlog item] — [YYYY-MM-DD]
Correctness: PASS / FINDINGS · Security: ... · Architecture: ... · Readability: ...

Findings:
- [BLOCKER|minor] file:line — what + why it matters

Could not verify: [anything the review had no way to check — e.g., external
API behavior, performance under load. Unverified is NOT passed.]

Disposition: [each BLOCKER fixed before closure; each minor fixed or
logged as a watch item with a reason]
```

### Closure rules

```
[ ] Zero unresolved BLOCKERs — fixes re-reviewed (the changed lines, not
    the whole diff again)
[ ] Minors fixed or logged as watch items with reasons
[ ] "Could not verify" list recorded — silence about limits is a failed review
[ ] Verdict recorded in the decision log
→ only then does the run-demo full demo proceed / the deployment continue
```

The author-agent may not waive, soften, or skip a blocker — the same
no-self-deferral rule as the demo gate. If author and review genuinely
conflict and a fix is unclear, surface both positions to the user; do not
quietly pick one.

---
