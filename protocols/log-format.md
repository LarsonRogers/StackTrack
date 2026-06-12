<!-- Starter Pack v12.0 — protocols/log-format.md -->
<!-- Load this file when: writing a decision log entry or handoff (every committed
     task, checkpoints), reconstructing history for an inherited codebase, or
     migrating a legacy CAPTAINS_LOG.md. -->
<!-- Do not load unless triggered — see AGENTS.md → Protocol Index -->

## Decision Log & Handoff — Format & Maintenance

Two artifacts replace free-form prose notes:

- **`DECISION_LOG.md`** — APPEND-ONLY structured log, oldest first, newest at
  the bottom. One compact entry per committed task. Never edited except to
  append (sole exception: a correction note appended as its own entry that
  references the entry it corrects). This is the audit trail and the
  overflow target for everything the bounded Part 2 summaries compress out.
- **`HANDOFF.md`** — OVERWRITTEN after every committed task. The "where are
  we right now" snapshot plus the ready-to-paste prompt for the next
  session, on any platform. Always current, always small.

Together: HANDOFF.md answers "where do I pick up?", DECISION_LOG.md answers
"how did we get here and why?". Wherever pack files say "the development
log", they mean DECISION_LOG.md.

### DECISION_LOG.md entry format (append after every committed task)

```markdown
## [YYYY-MM-DD] [task name] — [agent/platform]
- Did: [files/functions changed and what changed — specific identifiers]
- Decisions: [decision] — WHY: [rationale]   (one line per decision; omit if none)
- State: [what newly works / what is stubbed or incomplete — deltas only]
- Watch: [new loose ends, deferred items, risks — omit if none]
```

Rules:
- Append at the BOTTOM. Never rewrite, reorder, or delete existing entries.
- Deltas only — do not restate project state covered by earlier entries or
  by AGENTS.md Part 2.
- Be specific: real file paths, function names, identifiers. An entry a cold
  agent cannot act on is noise.
- Overrides granted by the user (default-policy unlocks), external research
  findings, new env vars, schema changes, and demo-gate deferrals are all
  recorded here, in the entry for the task they happened in.
- First entry of a project additionally records: **Audience mode** (also
  written to AGENTS.md Part 2) and **Pack version**.

### HANDOFF.md format (overwrite after every committed task)

```markdown
# Handoff — [project name]
<!-- Overwritten by the agent after every committed task. -->

**As of:** [YYYY-MM-DD] · **Pack version:** [vX.Y] · **Audience mode:** [mode]
**Last completed:** [task name]
**Confirmed next task:** [next task, or "ask the user"]
**Backlog position:** [item # in progress / next] (see BACKLOG.md)

**Open watch items:**
- [carried-forward unresolved items — pruned when resolved, with the
  resolution recorded in that task's DECISION_LOG.md entry]

**Resume prompt (paste into any agent):**
    Read AGENTS.md, then HANDOFF.md, then the last entries of
    DECISION_LOG.md as needed. Run the Session Resumption Protocol and
    report status before proceeding.
```

Watch items live in HANDOFF.md (current, pruned) and originate in
DECISION_LOG.md entries (permanent record). Resolving one = prune from
HANDOFF.md + record the resolution in the log entry of the resolving task.

### Reading order at session start

1. AGENTS.md (always-on; includes Audience Mode and project state summary)
2. HANDOFF.md — the anchor: last task, next task, open watch items
3. DECISION_LOG.md — read from the bottom, only as far as needed to act on
   the watch items and next task (typically 1–3 entries)

If HANDOFF.md is missing but DECISION_LOG.md exists: regenerate HANDOFF.md
from the last log entries before proceeding, and note the regeneration in
the next log entry.

### Changelog

There is no separate CHANGELOG.md — one write per task, in the decision log.
If a human-facing changelog is ever needed, generate it from DECISION_LOG.md
(date + task name + Did lines) rather than maintaining a second file.

### Inherited codebases — history reconstruction

Reconstructed entries (from git history — see protocols/inherited-codebase.md)
use the same entry format with a marker line and are appended oldest-first,
so reconstruction and live entries form one chronological append-only stream:

```markdown
## [date range] [Inferred phase name] — RECONSTRUCTED from git history
> ⚠️ Inferred, not written live. Confidence: [High/Medium/Low] — [reason]
- Did: ...
- State: ...
```

### Migration — legacy CAPTAINS_LOG.md (pre-v12 deployments)

If a `CAPTAINS_LOG.md` exists (created by an older pack version):

```
[ ] 1. Read its TOP entry (legacy format was newest-first) for current context
[ ] 2. Create DECISION_LOG.md; first entry = "Migrated from CAPTAINS_LOG.md"
        carrying forward: audience mode, last completed task, open watch
        items, pack version
[ ] 3. Create HANDOFF.md from the same facts
[ ] 4. Leave CAPTAINS_LOG.md in place as read-only history — renaming or
        deleting it requires user confirmation (safe-deletion procedure)
[ ] 5. From now on, write only DECISION_LOG.md + HANDOFF.md
```

---
