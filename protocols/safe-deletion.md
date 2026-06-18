<!-- Starter Pack v12.16 — protocols/safe-deletion.md -->
<!-- Load this file when: any file deletion is requested or proposed -->
<!-- Do not load unless triggered — see AGENTS.md → Protocol Index -->

## Safe Deletion Procedure

File deletion requires confirmation and a verified rollback path before proceeding:

```
[ ] 1. Identify the file and state exactly why it should be deleted:
        "I want to delete [path] because [specific reason — dead code,
        replaced by X, artifact from Y, etc.]"
[ ] 2. Verify a clean git state exists to roll back to if needed:
        git status  →  working tree must be clean (no uncommitted changes).
        If dirty: commit or stash all pending changes before proceeding.
        Do not delete files from a dirty working tree.
        git log --oneline -3  →  confirm last known-good commit
[ ] 3. Confirm with the user — wait for explicit approval before deleting
[ ] 4. Delete the file
[ ] 5. Run tests to verify nothing broke
[ ] 6. Commit with a descriptive message:
        "Remove [file] — [reason]"
[ ] 7. Note the deletion in the development log
```

If the user explicitly grants blanket deletion permission (e.g., "you can
delete files without asking"), record the override in the development log.
The override relaxes step 3 (per-file confirmation) only. Steps 1, 2, 5,
6, and 7 remain mandatory: the agent must still identify each file and
reason before deleting, verify rollback state, run tests, commit with a
descriptive message, and log the deletion.

**Untracked files with no backup:** If the target file is not tracked by git
and has no external backup, do not delete it. Instead, inform the user that
the file cannot be recovered if deleted and offer to back it up first (e.g.,
copy to a backup directory or `git add` it) before proceeding. This applies
regardless of blanket deletion overrides.

---
