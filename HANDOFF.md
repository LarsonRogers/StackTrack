# Handoff — StackTrack
<!-- Overwritten by the agent after every committed task. -->

**As of:** 2026-06-24 · **Pack version:** v12.19 · **Audience mode:** Technical non-dev
**Last completed:** **Redefine what counts as a stack change** (user-initiated).
Which item edits record a StackEvent (graph marker) is now narrowed to the
meaningful ones: **dose, dose-unit, schedule cadence, and a time-of-day BUCKET
crossing**. Group membership, the persistent note, rename, and med↔supplement
type changes are still SAVED but record **no marker**. Time buckets: **Morning
05:00–11:59 · Afternoon 12:00–17:59 · Night 18:00–04:59** (lower edge inclusive,
wraps midnight); multi-time items compare the SET of occupied buckets, so a
within-bucket shift (08:00→09:00) is not a change but 08:00→13:00 is.

**Key implementation note:** `updateItem` used to early-return (skip the save)
when nothing marker-worthy changed. Since organizational edits are no longer
marker-worthy, a new `inputDiffers()` helper detects ANY persisted-field change
separately from the marker-worthy `buildChangeSummary()`, so org-only and
within-bucket edits still persist — **no silent data loss** (verified in review).
New pure helpers `timeOfDayBucket`/`timeOfDayBuckets` + `TIME_OF_DAY_LABELS` live
in `lib/schedule.ts`. Existing StackEvent history is UNTOUCHED (immutable
snapshots); groups still snapshotted onto events for marker grouping.

**314 tests green** (+11); lint/typecheck/format/build pass; bundle 780 KiB (no
new deps). Independent fresh-context review **APPROVE, zero blockers** (stress-
tested the data-loss path). Demo confirmed by user.

**Committed on `feature/redefine-stack-change`; MERGING to `main` + PUSH** — CI
(lint/tests/security) + Cloudflare Pages auto-deploy run on the push. Confirm CI
green + live app updated; if CI fails, investigate before further work.

**No new dependencies** this task.

**>>> NEXT TASK (user-requested, not yet started — needs its own confirmed brief):**
Retroactively CLEAN UP existing "changed" StackEvents that wouldn't be recorded
under the new rules (group/note/name/type-only edits, and within-bucket time
changes). This is DESTRUCTIVE + has real subtleties — must brief before coding:
- Only `changed` events are affected; `added`/`removed`/`re-added` always stay.
- Historical events store only a `summary` string + name/group snapshot (no
  before/after field values) → must PARSE the old summary to classify. Old format
  joined parts with "; ": `dose: X → Y` / `unit:` / `schedule:` / `times: a, b →
  c, d` / `groups: … → none` / `note updated` / `name: X → Y` / `type: a → b`.
  Recompute bucket-crossing from the raw `times:` part. Parsing is FRAGILE (group
  names may contain ", ") → bias to KEEP when unsure (a stray marker beats
  deleting a real dose/schedule marker).
- SYNC/TOMBSTONES: deleting synced records must go through the tombstone path
  (#13c) or they resurrect from another device / the server. INVESTIGATE the
  sync+tombstone model (workers/ + syncEngine.ts + crypto libs) BEFORE designing.
- SAFETY NET: require/auto a JSON export backup (#7) before running; one-time
  migration vs. on-load. Destructive-op guardrail + safe-deletion protocol apply.

**Open watch items:**
- **#29 scope:** correlation summary is for the ONE selected metric only, on
  stack-change rows (not health events); composite metrics show no summary.
- **#29 windows can overlap adjacent changes** — descriptive by design, not deduped.
- **#28 deferred:** reminder-responsiveness analytics — natural #28b if wanted.
- **#28 schedule history:** adherence uses each item's CURRENT schedule for
  historical due-days (cadence isn't versioned). Documented in-app footnote.
- **#28 perf:** AdherenceScreen reads ALL intakes; fine for single-user local.
- **dnd-kit reorder duplication** (#38b): `reorderTodaySection`/`reorderItems`
  near-identical; left as-is (helper for 2 sites = over-engineering).
- **TruffleHog false-fail:** Dependabot PRs can show a red "Security scan" from the
  `BASE == HEAD` quirk — NOT a finding. Fix = `@dependabot rebase`.
- New DB *table* → extend export/import/merge/sync (4 libs) + fixtures + bump
  export-test schemaVersion. New *fields* on an existing table need none of that.
- Tier-use reporting is ON: note Light-tier (haiku) sub-task use in the work
  summary; silent when none ran. (This task used Opus for exploration + review.)
- Windows autocrlf: format only the files you touched (`prettier --check
  --end-of-line auto <files>` to find REAL issues amid the CRLF noise).
- A dev server may be running on :5173 — stop it when done (stopped this task).
- Pre-existing: items 12 + 13e sync demo gates open.
- Live app: https://stacktrack-ea9.pages.dev · Sync server: /health → ok.

**Resume prompt (paste into any agent):**
    Read AGENTS.md, then HANDOFF.md, then the last entries of
    DECISION_LOG.md as needed. Run the Session Resumption Protocol and
    report status before proceeding.
