# pack-dev/ — pack development artifacts. DO NOT COPY INTO PROJECTS.

Everything in this directory is meta-material for developing the starter pack
itself. It is excluded wholesale from distribution: when copying the pack into
a project, copy everything EXCEPT this directory. The boundary is the
directory, not a file list — new pack-dev artifacts go here and are excluded
automatically.

Contents:

- `known-limitations.md` — intentional tradeoffs and deferred decisions,
  consulted when auditing the pack itself. Never needed during project work.
- `DECISION_LOG.md` — the pack's own development log (append-only).
- `HANDOFF.md` — the pack's own development handoff (overwritten per task).

Deployed projects create their OWN fresh `DECISION_LOG.md` and `HANDOFF.md`
at the project root on first session (see `protocols/log-format.md`) — those
are runtime artifacts of each project, unrelated to the files here.
