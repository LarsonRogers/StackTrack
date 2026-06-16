# Handoff — StackTrack
<!-- Overwritten by the agent after every committed task. -->

**As of:** 2026-06-16 · **Pack version:** v12.0 · **Audience mode:** Technical non-dev
**Last completed:** Wave 3 Part C — boolean (yes/no) metric kind, logged via
a sliding No/Yes switch; 0/1 step line on graphs. Committed LOCAL ONLY (not
yet pushed). 146 tests green; lint/format/typecheck/build pass. NO schema
change (value 0/1 reuses the existing `value` field). Part B (composite) also
committed local-only earlier this session.
**Confirmed next task:** Wave 3 Part D — rename Metrics tab → "Tracking"
(LABEL ONLY). Last of the wave. Sequencing locked: 3 commits B→C→D.

  D. **Rename Metrics tab → "Tracking"** — LABEL ONLY (NavBar text +
     MetricsScreen h1/subtitle/"+ Add metric"/"metric(s)" copy + GraphsScreen
     empty-state "Define a metric on the Metrics tab"). Do NOT rename
     files/types (MetricsScreen, metricRepository, MetricKind). Update the
     2 test strings that assert "Metrics" copy (metricLogging.test.tsx:27,
     graphsScreen.test.tsx empty-state).

  Confirmed: NO schema migration for C (value 0/1 reuses the existing
  required `value` field). Keep the invariant: raw values only, NO
  normal-range interpretation/coloring.

**Wave plan (agreed):** W1 ✅ · W2 ✅ · W3 = A ✅ layout · B ✅ composite ·
C ✅ boolean · D rename "Tracking" (next).

**Open watch items:**
- Wave 3-B and 3-C are committed LOCAL ONLY. Nothing pushed/deployed since the
  pre-Wave-3 state (e287af9). When the user is ready to ship B/C/D, push —
  CI auto-deploys the app (NOT the sync worker; manual redeploy in RUNBOOK).
- Demo gate still OPEN for item 12 (real cross-device merge) + item 13e
  (live two-device sync demo).
- `.github/workflows/agent-ci.yml` has intentional failing placeholders.
- CI warning (not failing): actions/checkout@v4 + setup-node@v4 run on Node
  20, deprecated after June 2026. Bumping to v5/Node 24 is a CI-config change
  — needs user confirmation before editing.
- Live app: https://stacktrack-ea9.pages.dev · Sync server: /health → ok.

**Resume prompt (paste into any agent):**
    Read AGENTS.md, then HANDOFF.md, then the last entries of
    DECISION_LOG.md as needed. Run the Session Resumption Protocol and
    report status before proceeding.
