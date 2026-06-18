<!-- Starter Pack v12.16 — protocols/secure-coding.md -->
<!-- Load this file when: a task touches input handling, authentication or
     authorization, sessions, stored data, file/path handling, output
     rendering (HTML/templates), or anything reachable by untrusted users. -->
<!-- Does NOT trigger when: pure internal refactors, docs, styling, or logic
     with no untrusted input and no data boundary. -->
<!-- Do not load unless triggered — see AGENTS.md → Protocol Index -->

## Secure Coding Protocol

Leak-prevention (the secrets guardrails) stops credentials reaching the
repo. This protocol is the other half: the code itself must not be
exploitable. Principles: never trust input; deny by default; least
privilege; use the framework's security features instead of inventing your
own.

### Where capable models actually miss — verify these hardest

Spend the scrutiny where the misses are. A capable model usually parameterizes
queries, escapes output, and even gets object-ownership (IDOR) right on its own —
and reliably **under-weights, or silently skips, the items below.** (Observed: in
an A/B build, the unguided model shipped login + edit/delete with *no CSRF* and
rationalized the gap; the review gate is what caught it — pack-dev/ab-test-pack-value.md.)
Treat these as the gate, not a footnote:

```
[ ] CSRF on EVERY state-changing request — incl. login/register (login-CSRF,
    session fixation). SameSite alone is not a CSRF strategy; verify a token.
[ ] Sessions: server-side invalidation on logout, expiry, rotation on login;
    HttpOnly + Secure + SameSite. Rate-limit login and other abusable endpoints.
[ ] Authorization on EVERY endpoint (not just "is logged in") — object-level
    ownership on every client-supplied ID; deny by default.
[ ] Error/timing hygiene that leaks: username enumeration (login/reset/register),
    stack traces, internal IDs/paths to the user.
```

These are not new items — they are the high-miss subset of the full checklist
below, pulled to the front so attention lands there. Do not skip the rest.

### The checklist — apply every item relevant to the task

The **basics** below (input validation, parameterized queries, output encoding) a
capable model usually handles — **confirm they're present, don't belabor them** —
and put the real effort into the high-miss set above. This relaxation is for
capable models only: on a weak or local model the basics are NOT reliable —
treat them as unverified and apply every item in full.

**Input — at every boundary (API, form, file upload, CLI arg, URL param):**
```
[ ] Validate type, length, format, and range BEFORE use
[ ] Allowlist valid values where possible; reject rather than sanitize
[ ] Treat ALL client-supplied data as untrusted — including headers,
    cookies, hidden fields, and IDs in URLs
```

**Queries & commands:**
```
[ ] Parameterized queries / ORM bindings ONLY — never build SQL, NoSQL,
    or shell commands by string concatenation with user data
[ ] No eval/exec/dynamic code paths on user-influenced data, ever
```

**Authorization (distinct from authentication):**
```
[ ] EVERY endpoint/route/action checks authorization, not just login state
[ ] Object-level checks: a user can reach only THEIR records — verify
    ownership on every ID the client supplies (the classic IDOR hole)
[ ] Deny by default: a route with no explicit access rule is private
```

**Authentication & sessions:**
```
[ ] Use the framework's established auth library — NEVER hand-roll
    password hashing, token generation, or crypto
[ ] Passwords: bcrypt/argon2-class hashing (the library default)
[ ] Session cookies: HttpOnly, Secure, SameSite; logout actually
    invalidates server-side
[ ] Rate-limit login and other expensive/abusable endpoints
```

**Output & cross-site:**
```
[ ] Encode output for its context (HTML-escape by default — template
    engines usually do this; verify it is ON, don't bypass it)
[ ] No user data into innerHTML / dangerouslySetInnerHTML / raw template
    filters without a sanitizer
[ ] CSRF protection on every state-changing request (verify the
    framework's protection is enabled, not assumed)
```

**Files & paths:**
```
[ ] User-supplied paths/filenames validated against traversal (../)
[ ] Uploads: restrict type and size; store outside the web root or
    serve with forced-download/safe content type
```

**Errors & logging:**
```
[ ] No stack traces, queries, or internal paths shown to end users —
    log details server-side, show a generic message (communication.md
    governs how it is explained to the user)
[ ] No account-enumeration or timing oracles: login / password-reset /
    register give the same response (and similar timing) whether or not the
    account exists
[ ] Never log secrets, tokens, or PII
```

### Per-task security self-check (recorded, not vibes)

For any task this protocol applies to, the task summary and decision log
entry must include:

```
Security self-check: [which checklist sections applied] — [pass /
findings fixed / finding logged as watch item with reason]
```

The Definition of Done's security item is satisfied only by this recorded
self-check. "Probably fine" is not a state.

### SAST — the mechanical layer

Static analysis runs in CI (security job): semgrep with the auto config
works on any stack out of the box; the agent sets it up / refines rulesets
during enforcement-tooling setup (protocols/enforcement-tooling.md). SAST is
set up per **Project Stakes** (protocols/project-stakes.md): Production by
default, and pulled forward to any stakes level the moment a task touches auth,
payments, or regulated/sensitive data (the secure-coding self-check below is
floor regardless — it always runs on input/auth/session/stored-data tasks). SAST
findings fail the build; each finding is fixed or explicitly triaged in the
decision log (false positive → suppress with same-line justification, real
→ fix). The verify-can-fail rule applies: at setup, plant a string-built
query in a scratch file and confirm the scanner flags it.

### Know the limits — when to escalate to humans

If the app handles payments, health data, or other regulated categories,
or authentication for users beyond the owner's circle: say plainly that
agent review is not a security audit, recommend a professional review
before public launch, and record the recommendation in the decision log.
This protocol raises the floor; it does not certify.

The threat-model answers in the product brief (data handled / who can
touch it / worst credible misuse) decide how much of this protocol applies
— re-read them when the data model changes, and update the brief if the
answer has changed.

---
