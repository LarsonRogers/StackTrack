# Handoff — StackTrack
<!-- Overwritten by the agent after every committed task. -->

**As of:** 2026-07-02 · **Pack version:** v12.19 · **Audience mode:** Technical non-dev
**Last completed:** **CI fix — pin actions to commit SHAs + Dependabot cooldown.**
The 2026-07-01 push (marker popup) failed CI: semgrep's registry added two new
blocking rules since the last green run — `github-actions-mutable-action-tag`
(8 findings: every action referenced by mutable tag) and
`dependabot-missing-cooldown`. Our code was green; only the security gate's own
config was flagged. Fix: all 8 action refs in `.github/workflows/agent-ci.yml`
pinned to full commit SHAs (with `# vX` comments; resolved live via gh api);
`.github/dependabot.yml` got `cooldown: default-days: 7` plus a NEW
`github-actions` ecosystem entry so the SHA pins keep receiving update PRs.

**CI run 28602970143 on the merge: ALL GREEN (validate / security / deploy) —
the Cloudflare Pages deploy ran, so the tappable-marker-popup feature from
2026-07-01 is NOW LIVE** (was blocked by the failed run). Live app responds 200.
334 tests / lint / typecheck untouched and passing.

**No new dependencies** this task.

**>>> OPEN / NEXT (pick up here):**
- **Latent bug still open (offered, not yet done): Today screen freezes "today"
  at mount.** `TodayScreen.tsx:49-50` — `today` is computed once and
  `selectedDate` is `useState(today)`; nothing rolls it over at midnight, so a
  PWA left open across midnight shows yesterday until manual reload. Small
  standalone fix (visibilitychange/interval that advances the date when the user
  hasn't navigated away). User aware; fix when they want it.
- **Backlog #29 was the last numbered item done (2026-06-24).** Top planned
  backlog items: **#30** consent framework (gates off-device #31/#32/#33 + therapy
  #39), **#37** Today collapsible meds section, **#36** multi-ingredient, **#40**
  auto refill reminder, **#34** attachments. #35 parked.

**Open watch items:**
- **Dependabot now also watches github-actions** (weekly, 7-day cooldown) — it
  will open PRs bumping the SHA pins; the `# vX` comment updates with them.
  First dynamic run already succeeded post-push.
- **Semgrep rules float** (`--config auto` pulls the live registry): a rule
  added upstream can redden CI without any repo change — exactly what happened
  here. If CI fails on a push that changed nothing relevant, check for new
  rules first.
- **Graph markers testing boundary:** tappable SVG handles render inside
  recharts, whose pixel layout jsdom can't produce — handle-CLICK is
  demo-verified; popup content + all three dismissal paths ARE unit-tested
  (graphMarkerPopup.test.tsx). Don't expect jsdom to cover layout-dependent
  chart behavior.
- **Popup anchoring** assumes `.graph-chart` keeps `padding-left:0`; if left
  padding is ever added, the `left: x` anchor will drift (viewBox.x is SVG-space).
- Reminders are NOT time-of-day gated — `Reminder.time` only orders the advisory
  (ready for push #20). A reminder shows on its occurrence DATE regardless of time.
- **#29 scope:** correlation summary is for the ONE selected metric, on stack-
  change rows only; composite metrics show no summary; windows can overlap
  adjacent changes (descriptive by design).
- **Stack-change rule (2026-06-24):** markers only for dose/dose-unit/schedule/
  time-of-day-bucket changes; org edits persist silently via `inputDiffers`.
- **#28 deferred:** reminder-responsiveness analytics (natural #28b).
- **#28 schedule history:** adherence uses each item's CURRENT schedule for
  historical due-days (cadence isn't versioned). In-app footnote documents it.
- **dnd-kit reorder duplication** (#38b): `reorderTodaySection`/`reorderItems`
  near-identical; left as-is.
- **TruffleHog false-fail:** Dependabot PRs can show a red "Security scan" from the
  `BASE == HEAD` quirk — NOT a finding. Fix = `@dependabot rebase`.
- New DB *table* → extend export/import/merge/sync (4 libs) + fixtures + bump
  export-test schemaVersion. New *fields* on an existing table need none of that.
  Deleting a synced record needs a tombstone (recordTombstone) to not resurrect.
- Tier-use reporting is ON: note Light-tier (haiku) sub-task use in the work
  summary; silent when none ran. (Recent tasks used Opus + Explore, no haiku.)
- Windows autocrlf: format only the files you touched (`prettier --check
  --end-of-line auto <files>` to find REAL issues amid the CRLF noise).
- Pre-existing: items 12 + 13e sync demo gates open.
- Live app: https://stacktrack-ea9.pages.dev · Sync server: /health → ok.

**Resume prompt (paste into any agent):**
    Read AGENTS.md, then HANDOFF.md, then the last entries of
    DECISION_LOG.md as needed. Run the Session Resumption Protocol and
    report status before proceeding.
