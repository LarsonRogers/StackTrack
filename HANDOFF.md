# Handoff — StackTrack
<!-- Overwritten by the agent after every committed task. -->

**As of:** 2026-06-16 · **Pack version:** v12.0 · **Audience mode:** Technical non-dev
**Last completed:** Feature waves 1 & 2 + Wave 3 Part A (all pushed/live): W1 = Med/Supp badge + groups on Today cards; W2 = optional dose `unit` + persistent per-item `note` (optional StackItem fields, no migration); W3-A = Today-card layout cleanup (vertical text block like the Stack card, fixes the squish). 133 tests green; lint/format/typecheck/build pass.
**Confirmed next task:** Wave 3 (do in a fresh session). Part A is DONE
(2026-06-16, pulled forward); remaining parts B/C/D, decisions all locked:

  A. ✅ DONE — Today-card layout cleanup (squish fixed: card now mirrors the
     Stack card with a vertical .today-item-text block; shipped/live).
  B. **Composite measurements** — new metric kind with user-defined numeric
     components (name + optional unit each), e.g. Blood Pressure = Systolic
     (mmHg) + Diastolic (mmHg). MetricEntry needs multiple values (add
     `values?: number[]` aligned to components; keep `value` for single
     kinds). Form: define components like the item-form "times" rows. Logger:
     N number inputs; display "120/80". Graphs: one series per component.
  C. **Boolean kind** — yes/no tracking (e.g. "Exercised today?"). Store as
     value 0/1 to reuse the number plumbing; logger = a checkbox/toggle;
     graph as a 0/1 step series (or markers).
  D. **Rename Metrics tab → "Tracking"** — LABEL ONLY (NavBar text + screen
     headings/subtitles + any "metric(s)" user-facing copy). Do NOT rename
     files/types (MetricsScreen, metricRepository, MetricKind) — keep the diff
     small and safe.

  Likely **NO schema migration** for B/C: metrics index is `++id,&uid,status`
  and metricEntries `++id,&uid,date,[metricId+date]` — `kind`, `components`,
  `values` are NOT indexed, so adding them rides along on writes (same as W2).
  Confirm before assuming; if true, no v-bump and no backup ritual. Keep the
  invariant: raw values only, NO normal-range interpretation/coloring.
  Files: db.ts, metricRepository.ts, metricEntryRepository.ts, MetricForm.tsx,
  MetricLogger.tsx, MetricsScreen.tsx, graphView.ts, GraphsScreen.tsx, NavBar.

**Wave plan (agreed):** W1 ✅ · W2 ✅ · W3 = A layout fix + B composite + C boolean + D rename "Tracking" (next, fresh session).

**Open watch items:**
- All of 2026-06-16's work is pushed, CI green, and confirmed live on the
  user's device (rating fix, groups v8 [lossless migration ran fine],
  Wave 1, Wave 2). The daily-note test flake is fixed (waits for the saved
  end-state, not the ambiguous note text; delay:null was tried + reverted).
- Demo gate still OPEN for item 12 (real cross-device merge) + item 13e
  (live two-device sync demo).
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
