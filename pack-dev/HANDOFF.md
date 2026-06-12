# Handoff — AI Agent Starter Pack (pack development)
<!-- PACK-DEV ARTIFACT: tracks development of the pack itself. Not a template;
     never copied into deployed projects (see pack-dev/README.md). This repo's
     logs live in pack-dev/ because the repo IS the pack source — deployed
     projects keep theirs at the project root. Overwritten per task. -->

**As of:** 2026-06-11 · **Pack version:** v12.0 · **Audience mode:** Developer
**Last completed:** Commit 8 — consistency pass, sensitive-data scope line, .gitattributes, v12.0 bump, full self-checks (BUILD PHASE COMPLETE)
**Confirmed next task:** Effectiveness trials (user-led). Candidate probes below must be exercised before v12.0 is tagged/released.
**Branch:** `revised` (12 commits ahead of main)

**Open watch items (OPEN — none silently closed):**
- PROBE 1 — `.claude/settings.json` ask-rule: in a FRESH Claude Code session on this repo, ask the agent to edit any `protocols/` file → a permission prompt must appear. (Rules load at session start; could not fire in the build session.)
- PROBE 2 — `opencode.json` edit-ask: in an OpenCode session, attempt an edit to AGENTS.md or `protocols/**` → prompt must appear; also confirm `read` deny on `.env`. (Schema-shape validated only; open upstream issue re: permission enforcement — treat as defense-in-depth either way.)
- SETUP.md Step 0: distribution-point placeholder awaiting the user's download link.
- Trial-phase suggestions (not commitments): first-session dry run as a non-dev with an empty folder (product-definition → walking skeleton → demo gate); inherited-codebase run; legacy CAPTAINS_LOG migration run.

**Resume prompt (paste into any agent):**

    This is the pack-development repo (branch `revised`); its own logs live
    in pack-dev/. Read AGENTS.md, then pack-dev/HANDOFF.md, then the last
    entries of pack-dev/DECISION_LOG.md as needed. The v12.0 build phase is
    complete; current work is effectiveness trials — start with the open
    probes above and report results before any further pack edits.
