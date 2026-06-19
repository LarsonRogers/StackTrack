# Handoff — StackTrack
<!-- Overwritten by the agent after every committed task. -->

**As of:** 2026-06-18 · **Pack version:** v12.16 · **Audience mode:** Technical non-dev
**Last completed:** Backlog #25 **Task C — per-occurrence reminder history**.
New `reminderEvents` table (schema **v12**): one row per Done/Snooze action
(`{ id, uid, reminderUid, occurrenceDate, action, snoozedUntil?, at, updatedAt }`),
appended atomically with the reminder update in `acknowledgeReminder` /
`snoozeReminder`. Per-reminder **History (N)** expander on RemindersScreen.
Rides export/import/merge/sync as a parentless uid-only table (like
`healthEvents`). **214 tests green** (was 209); lint/format/typecheck/build pass;
independent review **zero blockers** (one nit fixed: aria-controls on the toggle).
**This completes backlog #25 (in-app reminders, Tasks A/B/C).**

**SHIPPED — merged to main + pushed; CI redeploying.** The branch also carried
the earlier Reminders add-button spacing fix (`1f8a6ee`), so that ships now too.

**On main:** #23 metric notes, #24 frequency, #26 nav restructure, #25 Task B
reminders + polish, and now #25 Task C (this).

**Confirmed NEXT TASK: none set.** Pick the next item from `BACKLOG.md` (top
item first) and reformulate into a task brief before touching code. Likely
candidates from the prior watch list: FUTURE #20 (push reminders — the
declarative recurrence + this per-occurrence history are the data groundwork),
#21 (Apple Health), #22 (chunk first sync push).

**Open watch items:**
- Adding any new table: extend export/import/merge/sync (4 lib files: exportData
  bundle type+read+assembly, importData TABLE_NAMES+tx, mergeData DATA_TABLES+tx+
  dependents, syncEngine DATA_TABLES+emptyBundle) + the test fixtures
  (mergeData `bundleWith`, tombstones `emptyBundle`), and bump the export-test
  schemaVersion assertion. See the reminders (#25 B) and reminderEvents (this)
  commits for the exact mirror pattern.
- Reminders advisory shows only on the actual today (selectedDate === today).
- Windows line endings: `autocrlf=true` → `prettier --write .` rewrites EOL on
  many untouched files. After running it, revert EOL-only files (real diff is
  empty under `git diff --ignore-all-space`) to keep commits scoped; blobs are
  LF and CI passes regardless.
- A long background **dev server** may still be running on :5173 (started this
  session) — stop it if not needed.
- Nav nits deferred (non-blocking): no focus trap/restore in the cog dropdown.
- Deploy gated on the `security` job; dependabot tracks dev-tooling updates.
- Pre-existing: items 12 + 13e sync demo gates open.
- Pack: upstream **v12.18** available (local v12.16) — detect-only; user has not
  asked to upgrade (protocols/update-check.md → upgrade.md when they do).
- Live app: https://stacktrack-ea9.pages.dev · Sync server: /health → ok.

**Resume prompt (paste into any agent):**
    Read AGENTS.md, then HANDOFF.md, then the last entries of
    DECISION_LOG.md as needed. Run the Session Resumption Protocol and
    report status before proceeding.
