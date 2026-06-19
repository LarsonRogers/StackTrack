# Handoff — StackTrack
<!-- Overwritten by the agent after every committed task. -->

**As of:** 2026-06-18 · **Pack version:** v12.16 · **Audience mode:** Technical non-dev
**Last completed:** Backlog #25 **Task B — In-app reminders (core)**, plus a nav
cog CSS polish (folded in per user). New `reminders` table (schema **v11**);
recurrence (once / every-N-days / cycle) **+ time-of-day + snooze**; new
`lib/reminders.ts` (occurrence/due logic), `reminderRepository`, `ReminderForm`,
`RemindersScreen` (in the cog menu), and a Today **advisory** (`RemindersSection`)
with **Done + Snooze**. Rides export/import/merge/sync. **209 tests green** (was
188); lint/format/typecheck/build pass; independent review **zero blockers**
(one warning fixed: editing a reminder's recurrence now resets its ack/snooze).

**⚠️ Branch `feature/reminders` — committed, NOT merged or pushed (redeploy held
per user).** It contains BOTH the cog polish AND Task B. The user is verifying
visually before merge. Two things to confirm in the live/dev app:
1. **Cog is a consistent square** on every screen, pinned top-right (agent could
   not visually verify — only reasoned about the CSS).
2. **Graphs dropdown** is no longer overlapped by the chart (the `z-index:20` fix).
When happy: `git checkout main && git merge --no-ff feature/reminders && git push`
(that triggers CI + the live redeploy).

**On main:** #23 metric notes (06a330d), #24 frequency (9a8d956), #26 nav
restructure (46309e2). Task B branched off main after #26.

**Confirmed NEXT TASK (fresh session): Backlog #25 Task C — per-occurrence
history.** Plan agreed with the user:
- New `reminderEvents` table (schema **v12**): one row per Done/Snooze action —
  `{ id, uid, reminderUid, occurrenceDate, action: 'done'|'snoozed', snoozedUntil?,
  at, updatedAt }`. Append a row in `acknowledgeReminder`/`snoozeReminder`
  (reminderRepository) alongside the existing reminder update.
- A per-reminder **history view** (e.g. on RemindersScreen: expand a reminder to
  see its past occurrences/actions).
- Wire `reminderEvents` through export/import/merge/sync (parentless uid-only,
  exactly like `reminders`/`healthEvents` — add to: exportData bundle type+read+
  assembly, importData TABLE_NAMES+tx, mergeData DATA_TABLES+tx+dependents union+
  entry, syncEngine DATA_TABLES+emptyBundle). Update the export-test schemaVersion
  assertion (→ 12) + the `bundleWith`/`emptyBundle` fixtures in mergeData/tombstones
  tests (add `reminderEvents: []`).
- Cross-cutting → confirm a short pre-flight plan first. Start by reading the
  Task B reminders code (lib/reminders.ts, db/reminderRepository.ts) for context.

**Open watch items:**
- Adding any new table: extend export/import/merge/sync (4 lib files) + the test
  fixtures, and bump the export-test schemaVersion. See the metric-notes (#23)
  and reminders (this) commits for the exact mirror pattern.
- Reminders advisory shows only on the actual today (selectedDate === today).
- Windows line endings: `autocrlf=true` → run `npx prettier --write .` before
  committing if `format:check` flags CRLF after a branch checkout (blobs are LF;
  CI passes).
- A long background **dev server** may still be running (started this session) —
  stop it if not needed.
- Nav nits deferred (non-blocking): no focus trap/restore in the cog dropdown.
- Deploy gated on the `security` job; dependabot tracks dev-tooling updates.
- Pre-existing: items 12 + 13e sync demo gates open; FUTURE 20 (push reminders —
  #25 lays the data groundwork) + 21 (Apple Health) + 22 (chunk first sync push).
- Live app: https://stacktrack-ea9.pages.dev · Sync server: /health → ok.

**Resume prompt (paste into any agent):**
    Read AGENTS.md, then HANDOFF.md, then the last entries of
    DECISION_LOG.md as needed. Run the Session Resumption Protocol and
    report status before proceeding.
