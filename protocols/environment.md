<!-- Starter Pack v12.0 — protocols/environment.md -->
<!-- Load this file when: any environment-specific code or config is involved
     (URLs, ports, hostnames, env vars, dev/staging/prod differences) -->
<!-- Do not load unless triggered — see AGENTS.md → Protocol Index -->

## Environment Awareness

Code must not assume it is running in a specific environment unless that
environment has been explicitly confirmed.

### Rules

```
- No hardcoded environment-specific values — URLs, ports, hostnames,
  database names, API endpoints must come from config or environment variables
- No dev/debug flags left active in committed code
  (e.g., debug=True, verbose logging, mock data)
- No assumptions about file paths that only exist on one machine
- If the project has multiple environments (dev/staging/prod), changes
  must be verified safe for all of them before committing
```

### When environment differences are relevant

If a task involves environment-specific behavior, the agent must:
1. Ask which environment the change targets
2. Note any implications for other environments in the development log
3. Flag any manual deployment or config steps required as Watch Items

### Environment variables

- All environment-specific values go in `.env` files (already covered by hard
  guardrails — never committed)
- New environment variables introduced by the agent must be documented:
  - In the development log (what it is, what it controls, required vs optional)
  - In a `.env.example` file if one exists in the project

---
