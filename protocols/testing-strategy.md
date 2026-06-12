<!-- Starter Pack v12.0 — protocols/testing-strategy.md -->
<!-- Load this file when: writing or evaluating tests (not: reviewing results or running an existing suite) -->
<!-- Does NOT trigger when: merely reading CI output, reviewing test results
     without authoring or changing tests, or running an existing test suite
     as part of the Definition of Done checklist -->
<!-- Do not load unless triggered — see AGENTS.md → Protocol Index -->

## Testing Strategy

The agent must not write superficial tests that pass without actually
verifying behavior. Tests are the safety net — they need to catch real
breakage, not just confirm the code runs.

### What makes a test useful

```
Good test:    verifies a specific behavior or output given a specific input
              catches a real failure mode
              is independent of implementation details (tests what, not how)

Weak test:    just calls a function and checks it doesn't throw
              duplicates the implementation logic inside the assertion
              only tests the happy path when edge cases are the real risk
              passes before and after a bug is introduced
```

### When writing tests the agent must

```
[ ] Test behavior, not implementation — if the internals change but outputs
    stay the same, tests should still pass
[ ] Cover the happy path AND the most likely failure modes:
    - Null / empty / missing inputs
    - Boundary values (zero, negative, max)
    - Invalid types or formats
    - External service failures (mock them)
[ ] One assertion per test where possible — easier to diagnose failures
[ ] Name tests descriptively:
    "test_returns_error_when_input_is_empty" not "test_validate_1"
[ ] Never mock the thing being tested — only mock its dependencies
```

### Coverage guidance

The agent should aim for coverage that gives confidence, not a number:

```
Critical paths (auth, payments, data writes):  high coverage, edge cases included
Business logic / service layer:                high coverage
Controllers / route handlers:                  moderate — integration tests preferred
Utilities / pure functions:                    high — easy to test, high value
UI components:                                 smoke tests minimum
```

If a codebase has no tests, the agent must flag this before any refactor
(already in Refactor Protocol) and offer to write a baseline test suite
as a separate task before structural changes begin.

### When tests are impractical

Some code is genuinely hard to test automatically — hardware interfaces,
GUI interactions, real-time audio, external APIs in development. In these cases:

1. Note why automated testing is limited in the decision log
2. Document manual verification steps that stand in for automated tests
3. Isolate the untestable code to minimize how much depends on it

---
