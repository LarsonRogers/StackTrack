# Handoff — StackTrack
<!-- Overwritten by the agent after every committed task. -->

**As of:** 2026-07-01 · **Pack version:** v12.19 · **Audience mode:** Technical non-dev
**Last completed:** **Tappable graph markers → detail popup.** On the **Graphs**
screen, the vertical stack-change / health-event marker "dividers" are now
interactive: a small colored **handle** sits at the top of each marker line, and
tapping it opens a **read-only popup** with that change/event's details — colored
dot + caption ("Added to stack" / "Stack change" / "Removed from stack", or the
event category e.g. "Appointment") + date + title (e.g. "Started Vitamin D") +
the "why" note if one exists. Health-event handles sit slightly lower (dy=16)
than stack handles so same-day markers don't overlap. Dismiss via ×, tapping
off the card (a fixed transparent backdrop), or **Esc**.

**Key design:** `src/components/GraphMarkerPopup.tsx` is the popup (role="dialog",
mount-only focus to the close button, latest-onClose Esc effect). Handles render
INSIDE recharts via each `<ReferenceLine>`'s `label` render-prop
(`markerHandle` in `GraphsScreen.tsx` — enlarged transparent hit circle for touch
+ a 5px colored dot). Click → `selectMarker(x, data)` stores a normalized
`MarkerPopupData` + a clamped pixel x; the popup anchors horizontally to it inside
the now-`position:relative` `.graph-chart`. Selection clears on metric/range
change. **Read-only** — note editing stays in the list below the chart. Anchoring
relies on `.graph-chart` having `padding-left:0` (viewBox.x ≈ container x).

**334 tests green** (+5); lint/typecheck/format/build pass; bundle precache 786
KiB (+3, no new deps). Independent fresh-context review **APPROVE, zero blockers**
(acted on 2 MINOR: focus-steal-on-re-render fix + clarifying comments). Demo shown
(dev server :5173); user approved ("looks good") and asked to commit + push.

**Committed on `feature/graph-marker-popup`; MERGED to `main` + PUSHED** — CI
(lint/tests/security) + Cloudflare Pages auto-deploy run on the push. **Confirm CI
green + live app updated**; if CI fails, investigate before further work.

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
- **Graph markers testing boundary:** the tappable SVG handles render inside
  recharts, whose pixel layout jsdom can't produce — so handle-CLICK is
  demo-verified, while the popup content + all three dismissal paths ARE
  unit-tested (graphMarkerPopup.test.tsx). Same boundary the top-of-file comment
  in graphsScreen.test.tsx already documents. If you add layout-dependent chart
  behavior, don't expect jsdom to cover it.
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
- A dev server may be running on :5173 — stop it when done.
- Pre-existing: items 12 + 13e sync demo gates open.
- Live app: https://stacktrack-ea9.pages.dev · Sync server: /health → ok.

**Resume prompt (paste into any agent):**
    Read AGENTS.md, then HANDOFF.md, then the last entries of
    DECISION_LOG.md as needed. Run the Session Resumption Protocol and
    report status before proceeding.
