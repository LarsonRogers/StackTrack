# Handoff — StackTrack
<!-- Overwritten by the agent after every committed task. -->

**As of:** 2026-06-11 · **Pack version:** v12.0 · **Audience mode:** Technical non-dev
**As of update:** 2026-06-12
**Last completed:** Item 13b — client crypto (PBKDF2 600k → HKDF split: groupId / authToken / non-extractable AES-GCM key; 10 tests incl. server-format cross-checks)
**Confirmed next task:** Item 13c — tombstones (schema v6): soft-delete markers so deletions propagate through sync and file-merge. Then 13d sync engine + settings UI, 13e live demo.
**Backlog position:** items 1–11 + 14 done; 12 awaiting demo; 13a+13b done of five (see BACKLOG.md)

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
