# Handoff — StackTrack
<!-- Overwritten by the agent after every committed task. -->

**As of:** 2026-06-11 · **Pack version:** v12.0 · **Audience mode:** Technical non-dev
**As of update:** 2026-06-12
**Last completed:** Item 13c — deletion tombstones, schema v6 (committed, push HELD for user backup ritual)
**Confirmed next task:** User exports fresh JSON backups (PC + phone) → push 13c → item 13d — sync engine + settings UI (needs task brief). Then 13e live demo.
**Backlog position:** items 1–11 + 14 done; 12 awaiting demo; 13a–13c done of five (see BACKLOG.md)

**Open watch items:**
- Demo gate OPEN for item 12: user must run a real cross-device merge.
- CI deploys the app but NOT the sync worker (token is Pages-scoped); manual redeploy command in RUNBOOK.
- Live app: https://stacktrack-ea9.pages.dev · Sync server: /health must return ok.
- `.github/workflows/agent-ci.yml` has intentional failing placeholders — wiring it needs user confirmation (CI-change policy).
- Root README.md still describes the starter pack, not StackTrack.

**Resume prompt (paste into any agent):**
    Read AGENTS.md, then HANDOFF.md, then the last entries of
    DECISION_LOG.md as needed. Run the Session Resumption Protocol and
    report status before proceeding.
