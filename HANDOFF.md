# Handoff — StackTrack
<!-- Overwritten by the agent after every committed task. -->

**As of:** 2026-06-18 · **Pack version:** v12.19 · **Audience mode:** Technical non-dev
**Last completed:** **Starter-pack upgrade v12.16 → v12.19** (user-requested).
On branch `pack-upgrade/v12.19`, **committed but NOT merged to main** — per
protocols/upgrade.md the user reviews the full diff and merges when ready.

**What changed (37 pack-owned files; zero project/source/log files touched):**
- 33 protocols + CLAUDE.md + TASK_TEMPLATE.md replaced wholesale to v12.19. 30
  were header-only; 3 substantive additive sections: code-quality "Right-sized &
  Resilient", model-tiering "Surfacing Light-tier use (opt-in)", testing-strategy
  "Fast feedback vs the gate".
- AGENTS.md: Part 1 from upstream (header + 2 standing-rule line updates); Part 2
  preserved verbatim + ONE new field — **Model Tiers → Tier-use reporting: on
  (decided 2026-06-18)** (user chose ON when asked).
- .gitattributes: a one-word upstream comment fix. All other config files
  (.claude/settings.json, opencode.json, .codex/config.toml, the customized CI
  workflow, .gitignore) intentionally preserved.

**ACTIVE BEHAVIOR CHANGE — Tier-use reporting is ON:** when any sub-task runs on
the Light tier (haiku) during a turn, append a one-line note to that turn's work
summary (count + which tasks). Stay silent on turns with no Light-tier use. Tier
use is still logged in DECISION_LOG regardless.

**To finish the upgrade:** review the diff on `pack-upgrade/v12.19`
(`git diff main...pack-upgrade/v12.19`) and merge to main when satisfied:
`git checkout main && git merge --no-ff pack-upgrade/v12.19`. Nothing is pushed
yet. The upstream clone used as the copy source was a temp dir (auto-cleaned).

**Confirmed NEXT TASK: none set.** After the upgrade merges, pick the top item
from `BACKLOG.md` and reformulate into a task brief before touching code.

**Open watch items:**
- Pack now v12.19; the launch update-check hook compares against upstream
  `main` (currently v12.19) — should report up-to-date after this merges.
- Adding any new DB table: extend export/import/merge/sync (4 lib files) + test
  fixtures + bump the export-test schemaVersion. See the reminderEvents (#25 C)
  and reminders (#25 B) commits for the mirror pattern.
- Reminders advisory shows only on the actual today (selectedDate === today).
- Windows line endings: `autocrlf=true` → `prettier --write .` rewrites EOL on
  many untouched files; revert EOL-only files to keep commits scoped (real diff
  is empty under `git diff --ignore-all-space`); blobs are LF, CI passes.
- Deploy gated on the `security` job; dependabot tracks dev-tooling updates.
- Pre-existing: items 12 + 13e sync demo gates open.
- Live app: https://stacktrack-ea9.pages.dev · Sync server: /health → ok.

**Resume prompt (paste into any agent):**
    Read AGENTS.md, then HANDOFF.md, then the last entries of
    DECISION_LOG.md as needed. Run the Session Resumption Protocol and
    report status before proceeding.
