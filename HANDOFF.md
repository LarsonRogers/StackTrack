# Handoff — StackTrack
<!-- Overwritten by the agent after every committed task. -->

**As of:** 2026-06-11 · **Pack version:** v12.0 · **Audience mode:** Technical non-dev
**As of update:** 2026-06-12
**Last completed:** Item 12a — sync foundations (uid + updatedAt on every record, schema v5, backfill migration). Committed locally, NOT pushed.
**Confirmed next task:** HOLD: user must export JSON backups on PC + phone, then push (auto-deploys the v5 migration). Then item 12b — merge-import "Sync from file" flow (needs task brief)
**Backlog position:** items 1–11 done; 12a done/12b next; 13 (E2E sync backend — required before shipping to users) queued (see BACKLOG.md)

**Open watch items:**
- DO NOT PUSH until user confirms JSON backups on both devices (v5 device DBs cannot downgrade; backups are the rollback path).
- Root README.md still describes the starter pack, not StackTrack.
- Live app: https://stacktrack-ea9.pages.dev (still serving pre-v5 build until push).
- `.github/workflows/agent-ci.yml` has intentional failing placeholders — wiring it needs user confirmation (CI-change policy).
- Root README.md still describes the starter pack, not StackTrack.

**Resume prompt (paste into any agent):**
    Read AGENTS.md, then HANDOFF.md, then the last entries of
    DECISION_LOG.md as needed. Run the Session Resumption Protocol and
    report status before proceeding.
