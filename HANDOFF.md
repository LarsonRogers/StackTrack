# Handoff — StackTrack
<!-- Overwritten by the agent after every committed task. -->

**As of:** 2026-06-16 · **Pack version:** v12.0 · **Audience mode:** Technical non-dev
**Last completed:** Feature waves 1 & 2 (pushed/live): W1 = Med/Supp badge + groups on Today cards; W2 = optional dose `unit` + persistent per-item `note` (both optional StackItem fields, NO schema migration — not indexed; shown joined "500 mg" and note under the name on Today + Stack). 133 tests green; lint/format/typecheck/build pass.
**Confirmed next task:** Wave 3 — composite measurements (user-defined numeric components, e.g. BP 120/80) + a yes/no boolean kind + rename the Metrics tab → "Tracking". Decisions locked: page name "Tracking", boolean INCLUDED, unit field = separate/joined-for-display (done in W2). Likely NO schema migration again (kind/components/values aren't indexed) — confirm during build.

**Wave plan (agreed):** W1 ✅ · W2 ✅ · W3 = composite + boolean + rename (next) · (W4 folded into W3: boolean).

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
