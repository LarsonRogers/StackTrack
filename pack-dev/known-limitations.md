<!-- Starter Pack v12.0 — pack-dev/known-limitations.md -->
<!-- PACK-DEV ARTIFACT: consulted only when auditing or developing the pack
     itself. Lives outside protocols/ on purpose — it is not a triggerable
     protocol and is not copied into deployed projects (see pack-dev/README.md). -->

## Known Limitations & Deferred Decisions

This section documents intentional design tradeoffs and explicitly deferred
items. These are not bugs or oversights — they are acknowledged limitations
with recorded rationale. Reviewers and agents should not flag these as issues.

Entries about the pre-v12 file layout (a separate always-loaded architecture
file, CLAUDE.md as a content file, duplicated trigger tables) were removed
when the pack was restructured around AGENTS.md as the single source of truth.

| Item | Status | Rationale |
|------|--------|-----------|
| **Platform-specific config files** (`.claude/`, `.codex/`, `opencode.json`) | Intentional | Claude Code, Codex, and OpenCode are the first-class supported agents. Config files for each are enforcement adapters; behavior rules live once in AGENTS.md. |
| **CLI-first operational assumptions** | Intentional | The pack targets developers and technical users as the operating environment; non-devs are supported as users through SETUP.md and the communication protocol, not through GUI-only tooling. |
| **Multi-agent concurrent editing** | Deferred | Branch-per-agent and merge conflict protocols are out of scope for a starter pack. Recommended convention: one agent per branch, human-managed merges. Add if a specific project requires it. |
| **Git unavailable fallback** | Deferred | Git is a hard dependency for rollback, log reconstruction, and checkpoint strategy. Environments without git are not supported. If git is unavailable, the agent flags it immediately and defers all file-modifying tasks. |
| **Host platform system instruction conflicts** | Out of scope | If a runtime injects system-level instructions that conflict with this pack, behavior is undefined. This pack cannot govern instructions it cannot see. |
| **Unified checklist token (REQUIRED_BEFORE_CODING)** | Deferred | Current `⚠️ REQUIRED PLACEHOLDER` labels are sufficient for human and agent detection. A machine-parseable token adds complexity for marginal gain. Revisit if programmatic placeholder scanning becomes a use case. |
| **Task brief duplication (AGENTS.md summary + TASK_TEMPLATE.md)** | Intentional | TASK_TEMPLATE.md is the working document; AGENTS.md summarizes for agent reference. Both are needed for different audiences. They are watched for drift. |
| **Screenshot / visual onboarding for non-devs** | Deferred | Out of scope for a text-based pack. A companion visual guide is a reasonable future addition but outside the markdown-only constraint. |
| **Non-dev "do exactly this" single boxed flow** | Deferred | SETUP.md already has a structured non-dev path, first-session transcript, normal/recovery distinction, glossary, and OS appendix. A single boxed canonical flow is a marginal improvement. Revisit if user testing shows first-time failure. |
| **Failure-path detail for non-git / no-file-read / partial placeholders** | Resolved | Documented as deterministic action paths in `protocols/edge-cases.md`. |
| **Mixed-intent sequencing rule (audit + edit in one prompt)** | Deferred | Current behavior (read-only until edits explicitly requested) is deterministic enough for the common case. A formal transition gate adds friction without meaningfully improving reliability. Revisit if user testing shows mode-switching errors. |
| **Dirty working tree handling in Pre-Edit Protocol** | Deferred to v12 cycle | Pre-Edit Protocol step 8 says "confirm git working tree is clean" but gives no deterministic branch for dirty-tree starts. Two agents could diverge: halt vs stash vs continue with warning. Proper fix requires branching logic across session types. |
| **External-system hard guardrail "cannot verify" wording** | Considered and declined | The guardrail is intentionally conservative — agents that encounter ambiguity are directed to the Knowledge Gap Protocol and protocols/external-research.md, which has explicit non-trigger examples. Adding a pointer inside the guardrail risks circular reference and softening a hard guardrail. Do not re-flag. |
| **Multi-trigger protocol ordering** | Deferred | When multiple protocol triggers fire simultaneously, load order is unspecified. A formal load-order rule creates a new maintenance surface with marginal reliability gain. Current behavior (load all triggered protocols, read in trigger-table order) is sufficient. Revisit if agents demonstrate ordering-dependent failures. |
| **"Agent uncertain" default-policy rubric** | Considered and declined (further elaboration) | Must-ask list and need-not-ask counter-list exist in the default policies. A full low/medium/high uncertainty rubric would make the clause harder to read and follow. Do not re-flag unless agent behavior shows measurable over- or under-confirmation in practice. |
| **Hard guardrail may over-block legitimate destructive operations** | Considered and declined | Forcing a manual handoff on locally-irreversible destructive operations is intentional. The agent cannot verify rollback paths, backup integrity, or downstream effects. User authorization alone is not sufficient justification for an agent to execute irreversible destruction autonomously. Do not re-flag. |
| **Version header format standardization across all pack files** | Resolved — v12.0 | Root files use `<!-- Starter Pack vX.Y — YYYY-MM-DD -->`; protocol files keep the file-identifying variant (`<!-- Starter Pack vX.Y — protocols/<file>.md -->`), which is intentional — it preserves provenance when a protocol is pasted into a chat in isolation. TASK_TEMPLATE.md now carries a header. |
| **Binary/generated artifact exception uses subjective "established convention" wording** | Considered and declined | Defining objective criteria would over-specify a judgment call intentionally left to agent + user confirmation. The explicit confirmation requirement is the safety net. Do not re-flag. |
