# Decision Log — StackTrack
<!-- APPEND-ONLY. Oldest first, newest at the bottom. One entry per committed
     task. Format: protocols/log-format.md -->

## [2026-06-11] Project definition & setup — Claude Code
- Did: Ran First Session Protocol (type B, idea-stage → product-definition
  protocol). Filled AGENTS.md Part 2 (summary, audience mode, stack,
  validation commands, file structure). Created BACKLOG.md (7 items),
  DECISION_LOG.md, HANDOFF.md. No app code written yet.
- Decisions:
  - Audience mode: Technical non-dev — WHY: user self-identified as
    "somewhat technical" in audience detection.
  - Pack version: v12.0.
  - Product brief confirmed (with one amendment): med/supplement stack
    tracker with groups, schedule times, daily checklist, ≤10 custom daily
    metrics (per-metric choice of 1–10 rating or free number), daily notes,
    metric graphs. Amendment: record the date of every stack change
    (add/edit/remove) and render color-coded markers at those dates on
    metric graphs — WHY: correlating metric trends with stack changes is
    the core value of the app.
  - Stack: React 18 + TypeScript + Vite, PWA via vite-plugin-pwa, IndexedDB
    via Dexie, Recharts, ESLint/Prettier, Vitest + RTL — WHY: fewest moving
    parts, local-first (private health data stays on device, no paid
    services), mature tooling, installable per user's end goal; data layer
    isolated so sync/accounts can be added later ("eventually public").
  - Out of MVP: push reminders, accounts/sync, export/import (item 7 is the
    first follow-up), dosage/interaction advice (permanently out of scope).
- State: Pack files + project definition only; no source code, no
  package.json. Validation commands written but not live until backlog
  item 1.
- Watch: Local-first = data lost if browser storage cleared before export
  (backlog item 7) lands — keep item 7 early. Reminders/notifications are
  the expected first post-MVP request.

## [2026-06-11] Detach from starter-pack repo; fresh git history — Claude Code
- Did: Folder had been copied from the AI_Agent_Starter_Pack repo with its
  .git intact (origin → github.com/LarsonRogers/AI_Agent_Starter_Pack.git,
  branches main/revised) — push risk to the pack repo. Renamed `.git` →
  `.git_starter_pack_backup/` (kept locally, gitignored, safe to delete —
  pack history also exists on GitHub and in the user's original folder).
  Ran `git init -b main`; initial commit 298c600 contains all 41 files
  including the project-definition work from the prior commit.
- Decisions: Back up inherited .git instead of deleting — WHY: safe-deletion
  protocol; it held one commit unique to this copy (content fully preserved
  in the initial commit). New default branch is `main` — WHY: pack git
  workflow; old `revised` branch was pack-development context.
- State: Standalone repo, no remotes. Inherited pack files (.github CI
  template, .claude/.codex/opencode enforcement configs) retained.
- Watch: `.git_starter_pack_backup/` can be deleted once the user confirms
  it is not needed. `pack-dev/` is starter-pack development history,
  unrelated to the app — candidate for deletion, needs user confirmation.
