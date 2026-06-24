# Handoff — StackTrack
<!-- Overwritten by the agent after every committed task. -->

**As of:** 2026-06-23 · **Pack version:** v12.19 · **Audience mode:** Technical non-dev
**Last completed:** Merged the **5 open Dependabot PRs**. #1 dexie 4.4.3→4.4.4
(the only runtime dep) + #2 wrangler 4.100.0→4.102.0 were green and merged
directly. #3 workers-types, #4 eslint-plugin-react-refresh, #5 typescript-eslint
each had a **false** "Security scan" failure — the TruffleHog `BASE == HEAD`
action quirk (no secret; scan refused to run on that commit range), confirmed in
the logs. A `@dependabot rebase` gave them a fresh commit range → scan passed →
merged one at a time. Net dev-tooling versions: workers-types →4.20260624.1,
eslint-plugin-react-refresh →0.5.3, typescript-eslint →8.62.0 (rebase pulled the
latest, not the PR's .61.1).

**`npm audit` now → 0 vulnerabilities.** The 5 pre-existing dev-tooling findings
(esbuild/undici/ws via miniflare+wrangler) are CLEARED by wrangler 4.102.0 — the
full-tree audit no longer relies on the `--omit=dev` CI scoping (that scoping
stays in place as a safety net; revisit only if you want to tighten it).

**No source/test changes** — 257-test suite unchanged. Final main CI green,
Cloudflare Pages auto-deployed. **No open PRs remain.** Local `main` is synced.

**Up next (BACKLOG.md):** #38b Today custom reorder (reuses dnd-kit + the `order`
field; open Q: one global order vs per-time-section), #28 adherence, #29
correlation, #30 consent framework (gates off-device #31/#32/#33 + therapy #39),
#34 attachments, #36 multi-ingredient, #40 auto refill reminder. #35 = parked.

**Open watch items:**
- **TruffleHog false-fail pattern:** any Dependabot PR can show a red "Security
  scan" from the `BASE == HEAD` quirk — it is NOT a finding. Fix is a
  `@dependabot rebase` (fresh commit range), then the scan runs normally. Worth a
  future workflow tweak (e.g. skip TruffleHog when base==head, or scan the diff
  differently) if it keeps recurring.
- **#38a model:** per-item `order` rank can go sparse/duplicate (archive, merge);
  the comparator (compare ranks directly + name tiebreak; unranked→Infinity→end)
  absorbs this into a stable total order. Don't "fix" sparsity by renumbering on
  every change — by design; renumbering would bloat sync deltas.
- New DB *table* → extend export/import/merge/sync (4 libs) + fixtures + bump
  export-test schemaVersion. New *fields* on an existing table need none of that.
- Tier-use reporting is ON: note Light-tier (haiku) sub-task use in the work
  summary; silent when none ran. (This task used no sub-agents.)
- Windows autocrlf: `prettier --write` rewrites EOL on untouched files; format
  only the files you touched to keep commits scoped (blobs are LF, CI passes).
- Pre-existing: items 12 + 13e sync demo gates open.
- Live app: https://stacktrack-ea9.pages.dev · Sync server: /health → ok.

**Resume prompt (paste into any agent):**
    Read AGENTS.md, then HANDOFF.md, then the last entries of
    DECISION_LOG.md as needed. Run the Session Resumption Protocol and
    report status before proceeding.
