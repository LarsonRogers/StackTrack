<!-- Starter Pack v12.16 — protocols/requirements.md -->
<!-- Load this file when: about to commit to a build or a change whose
     requirements/goal/scope carry risky unknowns — idea-stage product definition
     (always), an inherited project after its assessment (the intended change), or
     a large/ambiguous/cross-cutting task brief. Invoked by product-definition.md,
     inherited-codebase.md, and the task-brief / cross-cutting flow. -->
<!-- Does NOT trigger when: a small, clear, low-risk task (the standard task-brief
     reformulation is enough), or a read-only audit (there is no build to test). -->
<!-- Do not load unless triggered — see AGENTS.md → Protocol Index -->

## Requirement Pressure-Test

Surface and resolve the **high-leverage unknowns before committing** to a build
or a change — instead of locking in unexamined assumptions and discovering them
mid-build, where they cost the most. This is the portable equivalent of an
adversarial requirements interrogation; it depends on **no harness-specific
skill** (e.g. it is not the Claude-Code `grill-me` skill — it is the technique
that skill applies, written so all three harnesses run it identically).

This pressure-tests *what is wanted*. It is distinct from, and runs before, the
mechanical task pre-flight plan (cross-cutting.md, *which files in what order*)
and composes with — does not replace — the standard task-brief reformulation
("here is how I understand this, confirm/amend/reject").

### The technique

Interrogate the request across these categories — only the ones that actually
carry risk for this request; skip the rest:

```
- Assumptions        — what is being taken for granted that, if wrong, breaks it?
- Edge cases         — empty / huge / malformed / concurrent / offline inputs;
                       the first/last/zero case; what happens at the boundaries?
- Failure modes      — what does it do when a step fails, and who notices?
- Conflicts/ambiguity— two stated wants that can't both be true; a word doing
                       two jobs; "fast"/"secure"/"simple" left undefined.
- Hidden dependencies— an external system, account, data, or person this quietly
                       relies on (then: External Research / Knowledge Gap).
- Success, concrete  — turn "works well" into an observable test: "the user can
                       do X end-to-end and see Y." If you can't state the check,
                       the requirement isn't done being defined.
```

**Every question carries its context** — one clause on *why you're asking / what
decision it changes* ("I'm asking because it decides whether we need a database").
This keeps it from feeling like a quiz and doubles as plain-English education for
a non-dev.

### Bounded and audience-scaled

Depth scales to **two dials**, never to a fixed quota:
- **Risk/ambiguity of the request** — a vague or ambitious ask earns more
  pressure; a crisp, low-stakes one earns little or none.
- **Audience mode** (AGENTS.md Part 2) — *Developer*: press harder, allow
  technical framing, surface trade-offs directly. *Non-dev*: fewer questions,
  plain language, one decision at a time, never a wall of them.

**Stopping rule:** stop when the request's *risky* unknowns are resolved — not at
an exchange count, and not merely when "I could write it down." **Anti-nag:** do
not manufacture questions. If nothing risky remains, say so ("no open risks I can
see — proceeding") and move on. A clear, low-risk request may pass with zero
questions; that is a valid outcome, not a skipped step.

### Output

- Resolved unknowns flow straight into the brief / plan being built.
- A risk the user accepts rather than resolves is **recorded explicitly** — as a
  stated assumption in the brief and a watch item in the log — never carried
  silently. (Honesty rule: an unexamined assumption presented as a settled
  requirement is the failure this protocol exists to prevent.)

### The three lenses (what the caller points it at)

```
PRODUCT (idea-stage, product-definition.md Step 1b)
  → what to build: the requirements, the MVP boundary, who/where/success.

CHANGE BLAST-RADIUS (inherited-codebase.md, after the Phase 2 assessment)
  → what you want to DO here + what could break in code you didn't write.
    Informed by the assessment, so the edge/failure questions are concrete.

SCOPE & ACCEPTANCE (large/ambiguous/cross-cutting task brief)
  → the change's scope edges, acceptance criteria, and failure modes —
    BEFORE the mechanical pre-flight plan (cross-cutting.md).
```

The lens chooses *what* to interrogate; the technique, dials, stopping rule, and
anti-nag rule above are identical in all three.
