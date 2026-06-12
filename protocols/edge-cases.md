<!-- Starter Pack v12.0 — protocols/edge-cases.md -->
<!-- Load this file when: pack files missing, git unavailable, no file-read, no file-write, placeholder conflicts, DECISION_LOG missing/corrupt -->
<!-- Do not load unless triggered — see AGENTS.md → Protocol Index -->

## Edge-Case Handling

**Does NOT trigger for:** ordinary ambiguity that a single clarifying question
resolves (e.g., a missing placeholder value where the user can simply provide it).
Edge-case protocol is for structural failures — missing files, unavailable tools,
irreconcilable conflicts — not routine clarification needs.

Deterministic action paths for common failure scenarios. Load this section
when any of the trigger conditions below are encountered.

| Situation | Deterministic action |
|-----------|---------------------|
| **DECISION_LOG.md empty (zero-byte or no entries)** | Treat as corrupt — same behavior as missing. Proceed to session type detection (file-presence rule). Do not attempt to parse or resume from an empty log. |
| **DECISION_LOG.md missing or corrupt** | Treat as no-log session (but check for a legacy CAPTAINS_LOG.md first — if present, migrate per protocols/log-format.md). A log is "corrupt" when any of the following is true: (1) the file cannot be read or decoded as UTF-8, (2) no entry header (a line starting `## `) is found, or (3) the bottom entry lacks a date. Example: a file containing only HTML tags or binary gibberish is corrupt; a file with a truncated but parseable bottom entry is not — resume from what is readable. Run session type detection (file-presence rule). If non-pack files exist → Inherited Codebase Protocol. If no source files → First Session. Do not attempt to repair a corrupt log — note it and start fresh. |
| **Single protocol file missing from protocols/** | Halt when the missing protocol is triggered. Report exactly which file is missing: "protocols/[filename].md is missing. I need it to proceed with [situation]. Please restore it from the original pack zip." Do not guess or reconstruct the protocol behavior. To find what is missing, run `ls protocols/` and compare against the Protocol Index in AGENTS.md — every file the index names must exist. |
| **Protocol file present but unreadable** | Treat as missing — same halt/report behavior as "Single protocol file missing." A file is "unreadable" when it exists on disk but cannot be opened or decoded (e.g., permission denied, binary encoding, non-UTF-8 content). Report: "protocols/[filename].md exists but could not be read ([reason]). Please check file permissions and encoding, or restore it from the original pack zip." Do not attempt best-effort inference from a partially readable file. |
| **Multiple protocol files missing from protocols/** | Halt immediately regardless of trigger state. Report all missing files by comparing `ls protocols/` against the Protocol Index in AGENTS.md: "The following protocol files named in the Protocol Index are missing: [list]. The pack may have been copied incompletely. Please restore the full protocols/ directory from the original pack zip before continuing." Do not attempt to work around missing protocols or proceed with partial coverage. |
| **AGENTS.md missing** | Halt immediately, all agents. AGENTS.md is the single source of truth — policy and project specifics. Report: "AGENTS.md is missing. It is the primary instruction source; proceeding without it produces undefined behavior. Please restore it from the original pack zip." |
| **CLAUDE.md missing** | Claude Code only: CLAUDE.md is the import shim that loads AGENTS.md — without it Claude Code starts with no pack instructions. Halt and ask the user to restore it from the original pack zip (it is a few lines; do not reconstruct it yourself — that would be a pack-file edit). Codex and other agents: not a blocker — note the missing file in the session log and proceed. |
| **No git installed or git unavailable** | Report clearly what is unavailable: commits, rollbacks, history reconstruction, checkpoint strategy, and refactor protocol all require git. Offer read-only analysis and planning work only. Do not attempt to simulate git with manual file copies. |
| **No file-write capability (read works, writes fail)** | Pivot immediately to analysis and planning mode only. Do not attempt edits or commits — report each intended change as: "I would do X — please execute this manually or switch to a write-capable environment." Continue providing analysis, review, and task planning. Notify the user at session start: "I can read and analyze but cannot write files in this environment. I will describe all changes for you to apply manually." |
| **No file-read capability (web/paste-only agent)** | Ask the user to paste AGENTS.md (the single source of truth — policy and project specifics in one file). If HANDOFF.md exists, ask the user to paste it after AGENTS.md — it restores last task, next task, and watch items (audience mode is already in AGENTS.md Part 2). Ask for the last DECISION_LOG.md entries only if the watch items require them. Proceed from pasted content. When a protocol is triggered, ask the user to paste the relevant `protocols/[filename].md` file directly — this is the supported path in paste-only sessions. If the user cannot provide the protocol file, flag the gap clearly: state which protocol was triggered, what behavior it governs, and that you will proceed with best-effort interpretation based on AGENTS.md guardrails only. Do not halt the session solely because a protocol file could not be loaded via file-read. |
| **Partially filled REQUIRED placeholders** | Do not proceed with coding tasks. Report exactly which placeholders remain unfilled. Offer to infer any missing values from repo context, or ask the user directly for values that cannot be inferred. Never assume a placeholder value silently. |
| **Conflicting inferred placeholder values** | Present all candidates to the user with source for each: "I found two possible project names: 'foo' (from package.json) and 'bar' (from README). Which is correct?" Wait for explicit choice before writing. |
| **Pack version mismatch detected** | Halt and report — full procedure below. |

## Pack Version Mismatch Handler

Version headers are in the format: `<!-- Starter Pack vX.Y — YYYY-MM-DD -->`.
The check itself runs at session start (see AGENTS.md → Session Start):
`grep "Starter Pack v" AGENTS.md CLAUDE.md`.
Exception: in read-only / meta-review sessions the check is optional — the
session makes no writes, so a mismatch cannot corrupt state. If found during a
read-only session, include it in the findings but do not halt.

For all other session types, if headers differ → HALT. Report before doing anything:

```
"Pack file versions are inconsistent:
 AGENTS.md: [version]
 CLAUDE.md: [version]
This can cause conflicting behavior. Options:
1. I update all files to the latest version from the pack repo
2. You manually replace the outdated files
3. We proceed with caution — I'll flag any cross-file conflicts I detect"
```

Wait for user instruction before continuing.

If option 3 is chosen, operate in reduced-trust mode:

```
[ ] Trust only sections present in ALL versions (ignore version-specific additions)
[ ] Require explicit user confirmation before any file edit, even normally
    permitted ones — do not rely on default policies from a potentially
    outdated file
[ ] Log all detected cross-file conflicts in the development log before proceeding
[ ] Flag each action with: "Note: operating under version mismatch —
    confirm this is still the intended behavior"
```

Reduced-trust mode ends when all pack files are synchronized to the same
version (user completes option 1 or 2), or when the session ends.

