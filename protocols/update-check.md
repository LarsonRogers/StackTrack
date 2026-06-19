<!-- Starter Pack v12.19 — protocols/update-check.md -->
<!-- Load this file when: the user asks "is the pack up to date?" / "check for a
     newer pack version", or the optional launch notify-hook reports an update is
     available, or you are about to run an upgrade and want to confirm the target
     version first. -->
<!-- Do not load unless triggered — see AGENTS.md → Protocol Index -->

## Pack Update Check

Detect whether a newer pack version exists upstream. This is the **detect**
front-end; applying an update is `protocols/upgrade.md`. The two are separate on
purpose: checking is cheap, read-only, and safe to run anytime; upgrading
replaces pack files and is gated, branched, and user-confirmed.

**Detect only — never auto-apply.** This protocol reads a version number and
reports. It never downloads, overwrites, or commits anything. Applying an update
is always an explicit, separate step (upgrade.md), because pack files change only
on explicit instruction (AGENTS.md hard guardrail).

### The pack source (the referent)

The check needs to know *where upstream is*, and **the pack ships with it set**:
**AGENTS.md → Part 2 → Related Docs & Projects → "Pack source"** holds the raw
URL of the canonical upstream `AGENTS.md`. This one field is the single source of
truth — both the on-demand check below and the optional launch hook read it, so
there is nothing to configure out of the box. A **fork or private
redistribution** changes that one URL to point at its own upstream. If the field
has been blanked (no URL present), the check cannot run: say so and offer to
restore it — do not guess a URL.

### On-demand check (portable — all three harnesses)

Run when asked, or before an upgrade. Pure read + compare, no LLM judgement:

```
[ ] 1. Local version  — grep the header of the project's AGENTS.md:
        <!-- Starter Pack vX.Y — … -->
[ ] 2. Upstream version — fetch the Pack source URL and grep the same header
        from it (curl/wget, or the harness's fetch tool).
[ ] 3. Compare vX.Y numerically (major, then minor).
        - upstream == local      → "Up to date (vX.Y)." Done.
        - upstream  > local      → report "vLOCAL → vUPSTREAM available" and
                                   offer to run protocols/upgrade.md. Do NOT
                                   apply anything yet.
        - upstream  < local      → note the local copy is ahead (likely a
                                   dev/unreleased build); take no action.
[ ] 4. Fetch failed / offline / no Pack source / harness has no fetch tool at
        all → SKIP silently. Report only if the user explicitly asked:
        "Couldn't reach the pack source ([reason]); skipped the update check."
        Never block, never error out a session.
```

Offline-first is deliberate: the pack must run fully on an air-gapped or
local-LLM host. A failed check is a no-op, never a halt.

### Optional launch notify-hook (Claude Code only — opt-in, OFF by default)

For users who want launch-time awareness, a `SessionStart` hook can run the check
at startup and surface a one-line notice. It is **notify-only**: it prints whether
an update exists and never downloads or applies. Not enabled by default — it makes
an outbound request to the pack source on every launch, which an offline or
local-only setup should not do.

The pack ships the script at **`.claude/hooks/check-pack-update.sh`** (reads the
local + upstream version, prints one line only if behind, exits 0 on any failure
— never writes). It reads the upstream URL from the "Pack source" field above, so
there is nothing to edit in the script — just register it by adding this to
`.claude/settings.json` (or `settings.local.json`):

```json
{
  "hooks": {
    "SessionStart": [
      { "matcher": "startup",
        "hooks": [ { "type": "command",
                     "command": "${CLAUDE_PROJECT_DIR}/.claude/hooks/check-pack-update.sh" } ] }
    ]
  }
}
```

The hook's stdout is injected as session context, so when an update exists Claude
relays the one-line notice; the user then asks to run this protocol (or upgrade.md).
Codex and OpenCode have no equivalent shipped hook — their users run the on-demand
check above by asking. Keeping the launch automation Claude-Code-only preserves
tri-harness parity in the portable layer: the core check is identical everywhere;
only the convenience trigger is harness-specific.

### Honesty

Report the versions you actually read (local vX.Y, upstream vX.Y), not a guess. If
you could not reach upstream, say the check was skipped — never imply "up to date"
from a failed fetch. Silence about a skipped check reads as a clean result that
was not actually obtained.
