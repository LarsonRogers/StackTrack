<!-- Starter Pack v12.19 — protocols/pattern-registry.md -->
<!-- Load this file when: documenting a new reusable pattern before committing -->
<!-- Concrete trigger: same structural approach appears in 2+ files touched this session,
     OR a new approach replaced a previous one that was causing bugs -->
<!-- Does NOT trigger: one-off solutions, obvious language idioms, single-use helpers,
     patterns already present in the Pattern Registry -->
<!-- Do not load unless triggered — see AGENTS.md → Protocol Index -->

## Pattern Registry Maintenance

When the agent introduces a new pattern — a new way of structuring a module,
handling errors, managing state, etc. — it must document it in the
Pattern Registry before committing. The registry is a handoff artifact,
not an afterthought.

**Target location:** `AGENTS.md` → Part 2 → Pattern Registry section.

**Bounded living summary — HARD CAP 40 lines.** The registry is rewritten to
stay current, never grown append-only. If adding a pattern would exceed the
cap, compress: merge or drop superseded patterns and move their history to
the development log. Always-on context must not grow as the project ages.

**Required template — use exactly this format, one block per pattern:**

```
### [Pattern Name]
Purpose:      [One sentence: what problem this solves]
Location:     [File path of the canonical example]
Usage:        [How to apply it — what to do]
Anti-pattern: [What NOT to do instead — must be specific]
```

**When this protocol triggers:**
- The same structural approach (module layout, error handling, state management,
  etc.) appears in 2 or more files touched in this session
- A new approach explicitly replaced a previous one that was causing bugs
  or confusion — even if only used once so far

**Does NOT trigger when:**
- The approach is a one-off solution with no obvious reuse potential
- It is a standard language idiom (e.g., standard error propagation,
  obvious utility functions)
- A matching pattern already exists in the Pattern Registry
- The session touched only one file

**Minimum bar for a pattern to be registered:**
- It is used or will be used in more than one place, OR
- It replaced a previous approach that was causing bugs or confusion

**Do not register:** one-off solutions, obvious language idioms, or
anything already covered by an existing pattern entry.

---
