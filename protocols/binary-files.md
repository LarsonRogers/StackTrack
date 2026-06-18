<!-- Starter Pack v12.16 — protocols/binary-files.md -->
<!-- Load this file when: binary or large files (>1MB) encountered or committed -->
<!-- Does NOT trigger when: listing or displaying filenames/paths only (no content
     read or edit attempted), reading directory trees, or checking file sizes
     without opening file content. Size threshold (>1MB) applies to files being
     committed — not to files merely present in the repo. -->
<!-- Do not load unless triggered — see AGENTS.md → Protocol Index -->

## Binary & Large File Handling

Binary files and large assets require special handling — the agent must not
attempt to read, edit, or commit them without explicit awareness of what
they are and how they should be managed.

### What counts as binary or large

```
Binary files:     .amxd, .maxpat, .als, .wav, .mp3, .aif, .png, .jpg,
                  .pdf, .zip, .exe, .dll, model weights, compiled outputs
Large files:      any file over ~1MB — check before staging
Generated files:  dist/, build/, __pycache__/, *.pyc, node_modules/
```

### Rules

```
[ ] Never attempt to read or parse binary files as text
[ ] Never stage or commit binary files unless explicitly instructed
[ ] Never stage or commit files over 1MB without confirming with the user
[ ] Never commit generated or compiled output — these belong in .gitignore.
    Exception: if the repository already tracks generated artifacts by established
    convention (e.g., vendored codegen, static-site deploy branch, pre-built SDK),
    and the user explicitly confirms that committing is intentional, proceed.
    Flag the exception clearly in the commit message.
[ ] If a binary file needs to change, flag it:
    "This file ([name]) is a binary — it needs to be edited in [tool],
    not in code. I can't modify it directly."
```

### On first session — check .gitignore

During any codebase assessment, verify that a `.gitignore` exists and covers:
- Build output directories
- Dependency folders (node_modules/, venv/, etc.)
- Binary/compiled files specific to the stack
- `.env` files (already a hard guardrail but worth confirming)

If `.gitignore` is missing or incomplete, flag it and offer to create or
update it as a separate task before any other work begins.

### Large file storage

If a project needs to track large files (audio samples, model weights, etc.),
note Git LFS (Large File Storage) as the appropriate tool and flag it as a
setup task rather than committing large files directly.

---
