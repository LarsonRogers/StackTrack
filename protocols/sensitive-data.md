<!-- Starter Pack v12.0 — protocols/sensitive-data.md -->
<!-- Load this file when: inherited repos (proactive scan) or sensitive data encountered -->
<!-- Does NOT trigger when: values are obviously synthetic (e.g., "example.com",
     "YOUR_API_KEY_HERE", "foo@bar.com", hardcoded test fixtures with no real
     credentials), or when the file is a documented sample/template with
     placeholder values only -->
<!-- Do not load unless triggered — see AGENTS.md → Protocol Index -->

## Sensitive Data Handling

**Scope — read before trusting a clean result:** this protocol catches KNOWN
credential and PII formats (the patterns below). It does not and cannot
detect arbitrary confidential or privileged content — business plans, client
documents, unmarked personal data, anything sensitive by context rather than
by format. A clean scan must never be read as "no privileged data present."
Privileged or confidential material must be kept out of the repo entirely;
the scan is a tripwire for accidents, not a clearance mechanism. (See also
"Permission-rule limits" below: harness read-deny rules are defense-in-depth,
not a boundary.)

### Proactive scan (inherited codebases)

During Phase 1 of the Inherited Codebase protocol, the agent must scan for
sensitive data before any other work begins:

```bash
# Common patterns to scan for. All patterns use grep -E (extended regex) —
# plain grep treats {n} and + literally and silently matches nothing.
# NOTE: file types below are baseline examples — expand based on the repo stack.
# Also scan: *.bash, *.key, *.ini, *.conf, *.rb, *.go, *.php, Dockerfile,
# docker-compose.yml, and any config files.

# 1. Credential-bearing variable names
grep -rnEi "password|secret|api_key|apikey|token|private_key" . \
  --include="*.py" --include="*.js" --include="*.ts" \
  --include="*.env" --include="*.json" --include="*.yaml" --include="*.yml" \
  --include="*.toml" --include="*.sh" --include="*.pem" --include="*.cfg"

# 2. SSN pattern
grep -rnE "[0-9]{3}-[0-9]{2}-[0-9]{4}" .

# 3. Email pattern
grep -rnE "[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}" .

# 4. Known API-key formats (AWS, GitHub, Slack, Stripe) — keys are dangerous
#    even when the variable holding them is innocently named
grep -rnE "AKIA[0-9A-Z]{16}|ghp_[A-Za-z0-9]{36}|xox[baprs]-[A-Za-z0-9-]{10,}|sk_(live|test)_[A-Za-z0-9]{10,}" .
```

**Verify the scan can fail before trusting a clean result:** plant a synthetic
SSN (`123-45-6789`), email, and AWS-format key (`AKIA` + 16 chars) in a scratch
file, confirm all four patterns above match it, then delete the scratch file.
A scan that cannot catch a planted secret proves nothing when it reports clean.

Report all findings to the user before proceeding. Do not proceed until the
user has acknowledged the findings and confirmed how to handle them.

### Flag on encounter

During any session, if the agent reads a file and encounters what appears to be:
- Real credentials or API keys (not placeholders)
- Personal identifying information (names, emails, phone numbers, addresses)
- Financial data or account numbers
- Proprietary business data that appears sensitive

The agent must stop and flag it:
```
"I've encountered what looks like sensitive data in [file]:
[description of what was found — do NOT reproduce the actual data]

I'd recommend [rotating these credentials / anonymizing this data /
confirming this is intentional] before continuing.

How would you like to proceed?"
```

### Hard rules — always apply

```
- Never reproduce sensitive data in the development log, commit messages,
  or any generated documentation
- Never log, print, or output credentials or PII in code unless explicitly
  required and clearly marked
- Never commit a file containing real credentials — flag it and stop
- If in doubt about whether something is sensitive, treat it as sensitive
```

### Permission-rule limits (applies to all harness configs)

The read-deny rules on `.env*` and `secrets/**` in `.claude/settings.json`
and `opencode.json` stop the agent's file tools from ingesting secret values,
but they do NOT stop indirect reads through shell commands (`cat .env`,
`grep KEY .env`) — the bash deny lists cover only rm/sudo/chmod. Treat the
permission rules as defense-in-depth, not a boundary. The real secret
boundary is keeping secrets out of the repo entirely: `.gitignore` coverage
plus secrets living outside the working tree.

---


---
