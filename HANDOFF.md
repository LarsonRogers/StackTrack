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

**SHIPPED — merged to main + pushed (476bc14); CI redeploying.** Includes the
cog polish (consistent square; menu raised above the Graphs chart; Graphs header
gained a one-line subtitle for clarity + cog spacing) AND reminders Task B.

**On main:** #23 metric notes (06a330d), #24 frequency (9a8d956), #26 nav
restructure (46309e2), #25 Task B reminders + polish (476bc14).

**You are on branch `feature/reminders-history` (the Task C branch).** It already
holds ONE pending, untested-by-CI change: a one-line Reminders add-button padding
fix (`RemindersScreen` active list now `stack-list metric-list`, matching the
1rem spacer Tracking uses). Per the user, it was deliberately NOT separately
tested/redeployed — validate + ship it together with Task C. `main` does not have
it yet.

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
