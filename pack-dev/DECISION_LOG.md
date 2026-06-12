# Decision Log — AI Agent Starter Pack (pack development)
<!-- PACK-DEV ARTIFACT: this log tracks development of the pack itself.
     It is NOT a template. Do not copy it into deployed projects — agents
     create a fresh DECISION_LOG.md per project (see protocols/log-format.md). -->

## [2026-06-11] Audit of pack v11.51 — Claude Code
- Did: read-only audit (inventory, accuracy pass vs official docs, lifecycle map); no files changed
- Decisions: refactor approved on branch `revised` — WHY: always-on context ~16k tokens vs vendor 200-line guidance; broken security scan; CI false-green; missing lifecycle endpoints; AGENTS.md/CLAUDE.md source-of-truth inversion
- State: findings + 8-commit plan approved by user

## [2026-06-11] Fix broken gates and delete orphan configs (4110746) — Claude Code
- Did: protocols/sensitive-data.md scan rewritten (grep -E, single-`\` continuations, API-key formats); agent-ci.yml placeholder jobs exit 1; trufflehog pinned v3.95.5, base/head omitted, fetch-depth 0; .codex/config.toml fallback comment corrected; .gitignore added; root settings.json + config.toml deleted (orphans)
- Decisions: every gate must be demonstrated failing before trusted — WHY: shipped scan matched 0/4 planted secrets while reporting clean
- State: scan catches 4/4 planted secrets; unconfigured CI exits non-zero

## [2026-06-11] Split ARCHITECTURE.md into core + protocols (78d7394) — Claude Code
- Did: ARCHITECTURE.md 1,194→463 lines; new protocols: communication, log-format, safe-deletion, code-quality, environment; version-mismatch handler moved to edge-cases.md; protocol count 16→21
- State: all cross-referenced headings still resolve; zero broken paths

## [2026-06-11] AGENTS.md single source of truth (4df0b96) — Claude Code
- Did: AGENTS.md = Part 1 policy + Part 2 project specifics; CLAUDE.md → @AGENTS.md shim; ARCHITECTURE.md deleted, full reference sweep (zero dangling); Authority Matrix moved from README; ask-rules added to .claude/settings.json
- Decisions: Part 2 = bounded living summary (Pattern Registry ≤40 lines, Project-Specific Architecture ≤60) — WHY: always-on budget must not grow with project age. Audience Mode = always-on Part 2 field — WHY: non-dev mode must not depend on a trigger firing
- State: always-on ~7.6k tokens (was ~16k)
- Watch: .claude/settings.json ask-rule prompt could not fire mid-session (rules load at session start) — verify in a fresh Claude Code session

## [2026-06-11] OpenCode third harness + read-deny fix (2e09597, 1c1179f) — Claude Code
- Did: opencode.json (per-path edit-ask on pack files, read+edit deny on .env*/secrets/**, bash denies, webfetch allow); harness lists updated; permission-limits note in sensitive-data.md
- Decisions: opencode.json is defense-in-depth, not a boundary — WHY: bash-side reads (cat .env) bypass read-deny in all harness configs; real boundary = secrets out of repo
- Watch: opencode.json edit-ask prompt unverifiable from Claude Code — verify live in an OpenCode session

## [2026-06-11] Lifecycle endpoints + hardened deploy gate (088e6de, 61d4b8f) — Claude Code
- Did: protocols/product-definition.md (idea→brief→recommended stack→BACKLOG.md, item 1 = walking skeleton); protocols/run-demo.md (RUNBOOK.md + DoD "user has seen it run", full demo on backlog completion, user-only deferral); protocols/deployment.md (opt-in, two-signal escalate-only sensitivity gate, concrete verified teardown)
- Decisions: demo gate cannot be self-deferred by the agent — WHY: gate exists for the user's eyes, not the agent's confidence. Deploy gate combines user declaration + agent assessment, either escalates — WHY: false negative = privileged data on a public URL
- State: gate logic executed against test cases; all failure paths demonstrated

## [2026-06-11] Single trigger table (bba81ce) — Claude Code
- Did: PROTOCOLS.md deleted; AGENTS.md Protocol Index is the only table; edge-cases re-keyed; hardcoded counts replaced by ls-vs-index comparison (bidirectional: missing + orphan)
- Decisions: completeness check derives from the index, not a count — WHY: counts go stale; the index is the list
- State: 24 indexed = 24 on disk; check demonstrated failing both directions

## [2026-06-11] Breadcrumb mechanism: DECISION_LOG + HANDOFF (this commit) — Claude Code
- Did: protocols/log-format.md rewritten as the DECISION_LOG.md/HANDOFF.md spec (append-only + overwritten handoff); CHANGELOG.md retired (generate from log if needed); read order now AGENTS.md → HANDOFF.md → log tail; CAPTAINS_LOG migration path; full reference sweep across AGENTS.md, 10 protocols, SETUP, README, TASK_TEMPLATE; this file and HANDOFF.md created for pack development itself
- Decisions: append-only oldest-first — WHY: prepend rewrites the file top every task (merge conflicts, no cheap tail read); reconstruction and live entries now form one chronological stream
- Watch: known-limitations.md is currently indexed as a triggerable protocol and counted in the 24 — move to pack-dev space outside protocols/ in commit 7/8 and drop its index row
- Watch: DECISION_LOG.md + HANDOFF.md in the pack repo are pack-dev artifacts (like known-limitations.md) — exclude from deployed-project copies in the commit 7/8 distribution work

## [2026-06-11] Pack-dev boundary, lore strip, setup gaps (commit 7) — Claude Code
- Did: created pack-dev/ (known-limitations.md moved from protocols/, pack's own DECISION_LOG.md + HANDOFF.md moved from root, README explaining the boundary); known-limitations index row + standing rule dropped (23=23); SETUP gained Step 0 pack-acquisition placeholder, Node.js prerequisite, OpenCode install (verified: npm i -g opencode-ai / curl script), git-init-is-the-agent's-job note; AGENTS.md First Session step 1b (git init); Part 2 Language Rules block removed, Code Style reduced to deviations-only DEFERRED placeholder; placeholder-inference.md rewritten with three buckets (Required / Deferred / set-by-other-protocol) covering every Part 2 placeholder
- Decisions: distribution exclusion is a directory boundary (pack-dev/), not a file list — WHY: lists go stale as new pack-dev artifacts appear; same principle as ls-vs-index. Deployed projects create their OWN root DECISION_LOG/HANDOFF at first session — WHY: read-order paths are root-relative and must resolve per-project, never to pack history
- State: always-on = AGENTS.md 33.1k chars + CLAUDE.md shim ≈ 8.3k tokens (baseline ~16k); ls-vs-index PASS 23=23; zero known-limitations refs in agent-loaded files
- Watch: resolved this commit — known-limitations move, pack-dev distribution exclusion. Still open — the two enforcement probes (fresh-session .claude ask-rule; live OpenCode edit-ask)

## [2026-06-11] Consistency pass + v12.0 (commit 8, final build commit) — Claude Code
- Did: testing-strategy trigger aligned (index row + protocol header: "not reviewing results / running existing suite"); session-type-D wording verified already consistent post-merge (no change needed); README session-start line updated for three harnesses; .gitattributes added (* text=auto); sensitive-data.md scope line added (catches known formats only — privileged content must stay out of the repo; clean scan ≠ clearance); known-limitations ledger verified (platform row updated for OpenCode; version-header row resolved — root files standard header, protocol files keep file-identifying variant intentionally; TASK_TEMPLATE.md header added); all headers bumped v11.51 → v12.0 (2026-06-11)
- Decisions: protocol files keep the file-identifying header variant — WHY: preserves provenance when a protocol is pasted into a chat in isolation
- State: self-checks PASS — version grep (all v12.0), ls-vs-index (23=23), dead-link scan (only intentional migration mentions), referenced paths exist, JSON+YAML parse. Refactor build phase complete: 12 commits on `revised`
- Watch: carried OPEN, not closed — (1) .claude/settings.json ask-rule fresh-session probe, (2) opencode.json edit-ask live probe, (3) SETUP Step 0 distribution-point placeholder (user fills). Next phase: effectiveness trials
