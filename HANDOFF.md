# Handoff — StackTrack
<!-- Overwritten by the agent after every committed task. -->

**As of:** 2026-06-16 · **Pack version:** v12.0 · **Audience mode:** Technical non-dev
**Last completed:** Item 15 — multiple groups per item (schema v8, lossless migration) + the 1–10 rating-row UI fix. 129 tests green; lint/format/typecheck/build all pass.
**Confirmed next task:** None set — awaiting user. Open: user's pre-deploy backup + live look at the new build, then push/deploy; item 13e (live two-device sync demo) and item 12's file-merge demo still open.

**Open watch items:**
- PUSHED + deploying: rating fix + groups v8 pushed to main 2026-06-16 after
  the user's Export-JSON backup. CI auto-deploys the app; v8 migration runs
  on each device on next load (lossless + atomic). Confirm the live app
  loads existing data correctly after deploy completes.
- Pre-existing flaky test: todayScreen "attaches a daily note" (environment
  timing, see 2026-06-12 log) — passes in isolation; not a regression.
- Demo gate still OPEN for item 12 (real cross-device merge).
- CI deploys the app but NOT the sync worker (manual redeploy in RUNBOOK).
- Live app: https://stacktrack-ea9.pages.dev · Sync server: /health → ok.
- `.github/workflows/agent-ci.yml` has intentional failing placeholders.
- Root README.md describes StackTrack (done item 14).

**Resume prompt (paste into any agent):**
    Read AGENTS.md, then HANDOFF.md, then the last entries of
    DECISION_LOG.md as needed. Run the Session Resumption Protocol and
    report status before proceeding.
