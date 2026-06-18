# CLAUDE.md — Claude Code import shim
<!-- Starter Pack v12.16 — 2026-06-16 -->

@AGENTS.md

## Claude Code specifics

- `AGENTS.md` (imported above, inlined at launch) is the single source of
  truth for policy and project specifics. **Do not add project content or
  rules to this file** — they belong in AGENTS.md so Codex and Claude Code
  read identical instructions.
- `.claude/settings.json` is the Claude-side enforcement layer: it asks
  before any edit to AGENTS.md, CLAUDE.md, TASK_TEMPLATE.md,
  or `protocols/**` (the pack-file hard guardrail, enforced by the harness),
  and denies reads of `.env*` and `secrets/**`.
- If Claude-specific, path-scoped guidance is ever needed, put it in
  `.claude/rules/` (one topic per file, optional `paths:` frontmatter) —
  not here, and not in AGENTS.md if it is genuinely Claude-only.
