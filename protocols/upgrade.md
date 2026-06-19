<!-- Starter Pack v12.19 — protocols/upgrade.md -->
<!-- Load this file when: the user asks to upgrade/migrate an existing project to a
     newer pack version, OR the edge-cases version-mismatch handler points here to
     migrate rather than just halt. -->
<!-- Do not load unless triggered — see AGENTS.md → Protocol Index -->

## Pack Upgrade / Migration

Migrate an existing **deployed project** from an older pack version to a newer
one. The pack splits into pack-owned files (replaced wholesale from the target
version) and project-owned files (preserved untouched). This protocol is the
splice-and-preserve procedure that keeps the two apart.

**This is a procedure, not a script.** Run it by hand, one step at a time,
confirming with the user where the steps say to. Do not automate it end-to-end
— every diff-and-confirm step exists because the file it touches may be
user-customized.

**Detecting that an upgrade is available** is a separate, read-only step —
`protocols/update-check.md` compares the local version against the recorded pack
source and routes here when behind. This protocol is the *apply* half; it assumes
you already know the target version (Step 1 confirms it either way).

**Distinguish from the version-mismatch handler.** `protocols/edge-cases.md`
*detects* an inconsistency *within one project's* pack files and halts. This
protocol *upgrades* a whole project to a newer pack version on purpose. Edge
cases points here when the user wants to migrate rather than halt.

### Preconditions (all required)

```
[ ] git is available (this protocol is entirely git-reversible; without git,
    do not proceed — see edge-cases.md "No git installed")
[ ] Working tree is clean (commit or stash project work first)
[ ] You have the target version's pack files available (the new pack zip /
    checkout) to copy from — you are not reconstructing them from memory
[ ] Source and target versions are both known (see Step 1)
```

If any precondition fails, stop and report which one — do not guess.

### File ownership — what moves and what never moves

| File / path | Ownership | Upgrade action |
|-------------|-----------|----------------|
| `protocols/**` | Pack-owned | **Replace the whole directory**: copy in all target files, delete any the target no longer ships (see Structural deltas). |
| `CLAUDE.md` | Pack-owned (import shim) | Replace wholesale. |
| `TASK_TEMPLATE.md` | Pack-owned | Replace wholesale. |
| `AGENTS.md` | **Split** | Replace Part 1 + preamble from target; **preserve project's Part 2 verbatim**; add Part 2 sections new to the target as NOT-SET placeholders (Step 3). |
| `.github/workflows/agent-ci.yml`, `.github/dependabot.yml` | Pack-seeded, user-tunable | Diff and confirm per change (Step 4). |
| `.claude/settings.json`, `.codex/config.toml`, `opencode.json` | Pack-seeded, user-tunable | Diff and confirm per change (Step 4). |
| `.gitignore`, `.gitattributes` | Pack-seeded, user-tunable | Diff and confirm per change (Step 4). |
| `SETUP.md` | Pack doc (bootstrap) | Often already removed by the project. If present, treat as pack-owned but optional — offer to update or drop; confirm. |
| `README.md` | **Project-owned** in a deployed project | **Never touch** — the project replaced the pack's README with its own. |
| `DECISION_LOG.md`, `HANDOFF.md`, `BACKLOG.md`, `RUNBOOK.md` | Project-owned | **Never touch.** |
| Source code, project config, data | Project-owned | **Never touch.** |
| `.env*`, `secrets/**` | Project-owned, credential-bearing | **Never touch** (hard guardrail). |

When a file is not in this table, default to project-owned and leave it alone;
flag it to the user rather than assuming it is pack-owned.

### Step 1 — Determine source and target versions

Source version from the project's `AGENTS.md` header:
`<!-- Starter Pack vX.Y — YYYY-MM-DD -->`. Target version from the incoming
pack's header. If the project's AGENTS.md has **no** version header but a
`CAPTAINS_LOG.md` exists, treat it as a pre-v12.0 deployment (see Structural
deltas). If the source version cannot be determined at all, stop and ask — do
not assume.

State both versions to the user before proceeding: "Migrating this project from
vA.B to vX.Y."

### Step 2 — Branch first

```bash
git checkout -b pack-upgrade/vX.Y    # X.Y = target version
```

All upgrade work happens on this branch. Nothing lands on the project's main
branch until the user reviews the full diff and merges.

### Step 3 — Splice AGENTS.md (the one file that is half pack, half project)

AGENTS.md has a hard structural boundary: everything up to and including the
end of **Part 1 — Policy** is pack-owned; everything from the **`# Part 2 —
Project Specifics`** heading to EOF is project-owned and agent-maintained.

```
[ ] 1. Take the target version's AGENTS.md as the base (its preamble + Part 1).
[ ] 2. Discard the target's example Part 2; splice the PROJECT's existing Part 2
       (from its "# Part 2" heading to EOF) on verbatim. The project's filled-in
       values, Pattern Registry, architecture sketch, and tier map are preserved
       exactly.
[ ] 3. Reconcile Part 2 SECTIONS by `##` header name:
       - Section in BOTH → keep the project's content unchanged.
       - Section in target but NOT in the project (a section the new version
         introduced, e.g. "Model Tiers") → append it from the target template
         as NOT-SET placeholders, in template order. NEVER invent values — but
         if it is a SETUP section (Model Tiers / Pack profile / tier map), don't
         leave it silently NOT-SET either: flag it now and fill it via the normal
         setup prompt before the upgrade closes (Step 7), per
         protocols/model-tiering.md (detect provider, propose Light+Capable, ask
         once; user may decline → single-tier). "Never invent" means don't guess
         values; it does not mean leave a needed setup block blank.
       - Section in the project but NOT in target (removed/renamed upstream) →
         keep the project's content and flag it for the user; do not delete
         project content to match a template. If it looks like a RENAME (the
         target adds a new section that supersedes it), say so and let the user
         decide — do not silently leave both, which splits one section in two.
[ ] 4. Bump the AGENTS.md header to the target version.
```

If the Part 1 / Part 2 boundary cannot be cleanly identified in the project's
AGENTS.md (e.g. a heavily hand-edited file), stop and ask rather than guessing
the splice point — a wrong cut either drops project content or leaks stale
policy.

Reconciliation above is by `##` section header, so it catches whole new
sections but not a new **row or field added inside an existing Part 2 section**
(e.g. a new row in the Related Docs table, or a new line in the Model Tiers
block). When the target version adds such a sub-section field, it will not
appear by section-level reconciliation — diff the target's Part 2 against the
project's and flag any new in-section fields for the user to add (as NOT-SET),
rather than assuming verbatim preservation carried them.

### Step 4 — Diff-and-confirm the enforcement + CI files

For each pack-seeded, user-tunable file (`.claude/settings.json`,
`.codex/config.toml`, `opencode.json`, `.github/**/*.yml` — note the CI
workflow is under `.github/workflows/` — `.gitignore`,
`.gitattributes`): show the user a diff of project-current vs target, and
confirm each change. The user may have tightened a rule, added a permission, or
pinned a CI version deliberately — never silently overwrite. Apply only the
confirmed changes. Record any kept-as-is divergence in the decision log.

### Step 5 — Apply structural deltas (version-to-version)

Replacing `protocols/` wholesale handles added and removed protocol files
automatically. Some older versions also had top-level files the current layout
dropped or renamed; handle those explicitly:

| From version | Delta | Action |
|--------------|-------|--------|
| pre-v12.0 (no AGENTS.md header / has `CAPTAINS_LOG.md`) | `ARCHITECTURE.md` + `PROTOCOLS.md` were the policy/trigger sources, now folded into AGENTS.md | After the AGENTS.md splice, these are superseded — confirm with the user, then delete via safe-deletion. Carry any project-specific content they hold into the matching AGENTS.md Part 2 section first, under the bounded-summary rule (respect the Part 2 line caps; overflow goes to DECISION_LOG.md, never grows Part 2). |
| pre-v12.0 | `CAPTAINS_LOG.md` / `CHANGELOG.md` (newest-first log) replaced by `DECISION_LOG.md` + `HANDOFF.md` | Run the CAPTAINS_LOG migration already specified in `protocols/log-format.md` (creates the two new files, leaves the legacy log as read-only history). Do not re-implement it here. |

For incremental upgrades (e.g. v12.3 → v12.6) there are no top-level deltas —
the `protocols/` replace and the AGENTS.md splice cover everything.

### Step 6 — Self-checks (must all pass before commit)

```
[ ] Version grep: every pack header matches the target — cover the root
    files AND every protocol header (a retained SETUP.md can carry a stale one):
    grep -r "Starter Pack v" AGENTS.md CLAUDE.md TASK_TEMPLATE.md SETUP.md protocols/
[ ] ls-vs-index BOTH directions: compare `ls protocols/` against the AGENTS.md
    Protocol Index — every indexed file exists, every file on disk has a row.
[ ] Cross-references resolve: no pointer to a protocol file that the target
    version renamed or removed.
[ ] Project content intact: DECISION_LOG.md, HANDOFF.md, BACKLOG.md, RUNBOOK.md,
    source, and the project's README.md are byte-for-byte unchanged
    (git diff shows them untouched).
[ ] AGENTS.md Part 2: all of the project's original filled values still present;
    any new sections are NOT-SET placeholders, not invented values.
```

A failure here means the splice or the file copy went wrong — fix on the branch,
do not commit broken state.

### Step 7 — Review, show diff, hand off

```
[ ] Any SETUP section added as NOT-SET in Step 3 (Model Tiers / Pack profile /
    tier map) is filled via the setup prompt (model-tiering.md) or explicitly
    recorded single-tier — not left blank. A new setup block is resolved before
    the upgrade closes, never carried forward NOT-SET.
[ ] Independent fresh-context review of the full upgrade diff — reuse the
    protocols/review.md mechanism (diff-only, fresh context, cite file:line);
    zero unresolved blockers before commit.
[ ] Show the user the COMPLETE diff before committing.
[ ] Commit on pack-upgrade/vX.Y with an imperative message
    ("Upgrade pack vA.B → vX.Y").
[ ] DECISION_LOG.md entry (source→target version, files replaced, Part 2
    sections added as NOT-SET, configs kept-as-is) + HANDOFF.md overwritten.
[ ] The user merges pack-upgrade/vX.Y when ready — the agent does not merge to
    the project's main branch unprompted.
```

### Fail-safe summary

- Never determined the source version → stop and ask.
- Never identified the Part 1/Part 2 boundary cleanly → stop and ask.
- Never invent a Part 2 value for a newly-added section → NOT-SET placeholder.
- Never delete project content to match a template → keep it and flag.
- Never overwrite a user-tunable config without a per-change diff-and-confirm.
- Hard guardrails are unchanged: `.env*`/`secrets/**` and project data are
  never touched; nothing here is locally irreversible (it is all on a branch).
