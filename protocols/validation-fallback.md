<!-- Starter Pack v12.0 — protocols/validation-fallback.md -->
<!-- Load this file when: lint, test, or CI commands are missing or unconfigured -->
<!-- Does NOT trigger when: tooling is configured but temporarily inaccessible
     (e.g., CI is down, network issue) — the commands exist, the environment is
     the problem. Also does NOT trigger when commands are present and running
     but tests are failing — that is a test failure, not missing tooling. -->
<!-- Do not load unless triggered — see AGENTS.md → Protocol Index -->

## Validation Tooling Fallback

When lint, test, type check, or CI commands are missing, placeholder, or
unavailable (common in inherited repos or early-stage projects):

```
[ ] 1. Report clearly which commands are missing or unconfigured:
        "I can't run [lint/tests/CI] — the command isn't configured yet."
[ ] 2. Propose alternatives where possible:
        - Suggest the standard tool for the detected stack
          (e.g., "ruff is standard for Python — want me to set it up?")
        - Offer to add the missing configuration as a separate task
[ ] 3. Mark the Definition of Done accordingly:
        - "Lint: skipped — not configured (flagged for setup)"
        - Never silently skip a validation step without noting it
[ ] 4. If CI is inaccessible from the agent environment (offline, no credentials):
        - Note it in the decision log (in read-only mode, report in-chat
          instead — do not update the log unless the user requests it)
        - Treat local test pass as the DoD gate
        - Flag CI verification as a Watch Item for the next human-accessible session
```

The agent never silently skips a validation step. Missing tooling is always
reported, with a proposed path to resolution.

---


---
