# Handoff — StackTrack
<!-- Overwritten by the agent after every committed task. -->

**As of:** 2026-06-18 · **Pack version:** v12.16 · **Audience mode:** Technical non-dev
**Last completed:** Backlog #26 — **Navigation restructure**. Bottom tab bar now
holds only the "view" screens (**Today, Graphs**); a top-right **settings cog (⚙)**
on every screen header opens a dropdown to the "set up" screens (**Stack, Tracking,
Sync** — Reminders joins in #25). New `NavContext` (App provides `{active, navigate}`)
+ new `SettingsMenu` component; all 5 views still reachable (View type unchanged).
Today's cog spans title→date-line (flex row, DateNav below); other screens pin it
top-right. **188 tests green** (was 183); lint/format/typecheck/build pass;
independent review **zero blockers** (one warning fixed).

**Branch `feature/nav-restructure` — committed, NOT merged or pushed.** Awaiting
user demo confirmation (dev server live at http://localhost:5173/ — **hard-refresh**,
the nav change is structural). Merge to main + push when happy (CI runs + redeploys).

**Done & on main:** #23 metric notes (06a330d), #24 frequency (9a8d956). This nav
task branched off #24's merge.

**Confirmed next task:** Backlog #25 — **In-app reminders** (Task B of the agreed
3-part plan). Adds a `reminders` table; recurrence (once / every-N-days / cycle)
**+ time-of-day + snooze-by-N-days** (user-requested additions); due/occurrence/
snooze logic in a new `lib/reminders.ts`; `ReminderForm` + a new `RemindersScreen`
reached from the cog menu (add a `{ view:'reminders', label:'Reminders' }` entry to
`SettingsMenu` + a `reminders` view to the `View` type + `App` SCREENS); a Today
advisory section with **Done + Snooze**; export/import/merge/sync wiring. Then
**Task C** = per-occurrence history (`reminderEvents` table + history view). Schema
bump expected in Task B (next is v11). Cross-cutting → confirm a pre-flight plan.

**Open watch items:**
- Adding a `reminders` view: extend `View` in `src/components/NavBar.tsx`, add to
  `App.SCREENS`, and add the menu entry in `src/components/SettingsMenu.tsx`
  (`SETTINGS_ITEMS`). The cog menu is the home for it.
- Nav nits deferred (non-blocking): no focus trap/restore into the dropdown;
  `aria-haspopup` semantics. Revisit if accessibility work is prioritized.
- Windows line endings: `autocrlf=true` → run `npx prettier --write .` before
  committing if `format:check` flags CRLF after a branch checkout (committed
  blobs are LF; CI passes).
- Deploy gated on the `security` job; dependabot tracks dev-tooling updates.
- Pre-existing: items 12 + 13e sync demo gates open; FUTURE 20 (push reminders —
  #25 lays its data groundwork) + 21 (Apple Health) + 22 (chunk first sync push).
- Live app: https://stacktrack-ea9.pages.dev · Sync server: /health → ok.

**Resume prompt (paste into any agent):**
    Read AGENTS.md, then HANDOFF.md, then the last entries of
    DECISION_LOG.md as needed. Run the Session Resumption Protocol and
    report status before proceeding.
