# Handoff — StackTrack
<!-- Overwritten by the agent after every committed task. -->

**As of:** 2026-06-11 · **Pack version:** v12.0 · **Audience mode:** Technical non-dev
**As of update:** 2026-06-12
**Last completed:** Item 13d — sync engine + Sync tab (E2E sync fully built; 117 tests)
**Confirmed next task:** Item 13e — the live two-device demo: user enables sync with the same passphrase on PC + phone and confirms data flows both ways (incl. a deletion). Closing it also closes item 12's still-open file-merge demo (sync supersedes it as the primary path, but file-merge should still be confirmed or explicitly waived).
**Backlog position:** items 1–11 + 14 done; 12 awaiting demo; 13a–13d done, 13e = demo (see BACKLOG.md)

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
