# Handoff — StackTrack
<!-- Overwritten by the agent after every committed task. -->

**As of:** 2026-06-16 · **Pack version:** v12.0 · **Audience mode:** Technical non-dev
**Last completed:** Item 15 — multiple groups per item (schema v8, lossless migration) + the 1–10 rating-row UI fix + a CI fix (flaky multi-group form test → functional group state, robust waits). Pushed to main; 129 tests green; lint/format/typecheck/build all pass.
**Confirmed next task:** None set — awaiting user. Open: user's pre-deploy backup + live look at the new build, then push/deploy; item 13e (live two-device sync demo) and item 12's file-merge demo still open.

**Open watch items:**
- PUSHED + deploying: rating fix + groups v8 pushed to main 2026-06-16 after
  the user's Export-JSON backup. CI auto-deploys the app; v8 migration runs
  on each device on next load (lossless + atomic). Confirm the live app
  loads existing data correctly after deploy completes.
- FIXED 2026-06-16: todayScreen "attaches a daily note" flake — test now
  waits for the saved end-state (findByRole 'Edit note') instead of the
  ambiguous note text, and confirms typing landed before saving. Stable
  25/25 + full suite 3/3. (delay:null was tried and reverted — it broke the
  Save click.) Pushed; confirm CI green.
- Demo gate still OPEN for item 12 (real cross-device merge).
- CI deploys the app but NOT the sync worker (manual redeploy in RUNBOOK).
- Live app: https://stacktrack-ea9.pages.dev · Sync server: /health → ok.
- `.github/workflows/agent-ci.yml` has intentional failing placeholders.
- CI warning (not failing): actions/checkout@v4 + setup-node@v4 run on Node
  20, deprecated after June 2026. Bumping to v5/Node 24 is a CI-config change
  — needs user confirmation before editing.
- Root README.md describes StackTrack (done item 14).

**Resume prompt (paste into any agent):**
    Read AGENTS.md, then HANDOFF.md, then the last entries of
    DECISION_LOG.md as needed. Run the Session Resumption Protocol and
    report status before proceeding.
