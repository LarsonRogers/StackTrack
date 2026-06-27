# Handoff — StackTrack
<!-- Overwritten by the agent after every committed task. -->

**As of:** 2026-06-26 · **Pack version:** v12.19 · **Audience mode:** Technical non-dev
**Last completed:** **One-time cleanup of obsolete stack-change markers**
(user-initiated follow-up to the 2026-06-24 "narrow what counts as a stack
change" rule). A **"Clean up old markers"** button on the **Stack** screen (new
"Clean up" section under Backup) removes historical `changed` StackEvents that
no longer count as stack changes (group/name/type/note edits, within-bucket time
tweaks). **Kept:** dose, schedule, time-of-day-bucket, start/stop markers, and
any event the user annotated with a "why" note. A **full JSON backup downloads
first**; each deletion records a **tombstone** in the same transaction so it
propagates across synced devices and won't resurrect.

**Key design:** classification lives in pure, tested `src/lib/legacyMarkers.ts`
(`isObsoleteChangeEvent`/`findObsoleteStackEvents`) — it PARSES the legacy
summary string (old events store no before/after values) with a strong **bias
toward keeping** (unrecognized/ambiguous → keep; review confirmed no adversarial
input can cause a false delete). `stackRepository.deleteObsoleteStackEvents()`
deletes + `recordTombstone` per event in one rw transaction, returns the count,
idempotent. Sync investigation confirmed stackEvents are synced and were never
tombstoned, so the tombstone path is what makes the deletion stick.

**329 tests green** (+15); lint/typecheck/format/build pass; bundle 783 KiB (no
new deps). Independent fresh-context review **APPROVE, zero blockers** (acted on
2 findings: singular-`group:` coverage + a `summary ?? ''` guard). Demo shown
(dev server); user moved to close-out ("prep handoff").

**Committed on `feature/cleanup-obsolete-markers`; MERGED to `main` + PUSHED**
(commit 06b9df2) — CI (lint/tests/security) + Cloudflare Pages auto-deploy run on
the push. **Confirm CI green + live app updated**; if CI fails, investigate
before further work.

**No new dependencies** this task.

**>>> OPEN / NEXT (pick up here):**
- **Latent bug to fix (offered, not yet done): Today screen freezes "today" at
  mount.** `TodayScreen.tsx:49-50` — `today` is computed once and `selectedDate`
  is `useState(today)`; nothing rolls it over at midnight or refreshes live, so a
  PWA left open across midnight shows yesterday (and the Reminders advisory for
  the new day won't appear) until a manual reload. Confirmed in the wild this
  session ("didn't show without refresh"). Small standalone fix (e.g. a
  visibilitychange/interval that advances the date when the user hasn't navigated
  away). User aware; fix when they want it.
- **Backlog #29 was the last numbered item done (2026-06-24).** Top planned
  backlog items: **#30** consent framework (gates off-device #31/#32/#33 + therapy
  #39), **#37** Today collapsible meds section, **#36** multi-ingredient, **#40**
  auto refill reminder, **#34** attachments. #35 parked.

**Open watch items:**
- Reminders are NOT time-of-day gated — `Reminder.time` only orders the advisory
  (it's ready for push #20). A reminder shows on its occurrence DATE regardless of
  time. (Context: a "reminder didn't load" report this session turned out to be a
  reminder set to start the next day — not a bug.)
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
- A dev server may be running on :5173 — stop it when done (stopped this task).
- Pre-existing: items 12 + 13e sync demo gates open.
- Live app: https://stacktrack-ea9.pages.dev · Sync server: /health → ok.

**Resume prompt (paste into any agent):**
    Read AGENTS.md, then HANDOFF.md, then the last entries of
    DECISION_LOG.md as needed. Run the Session Resumption Protocol and
    report status before proceeding.
