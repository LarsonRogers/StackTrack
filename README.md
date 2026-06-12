# StackTrack

A local-first web app for tracking your medication & supplement stack — what
you take and when — alongside custom daily metrics and notes, so you can see
over time whether your stack is actually working.

**Live app:** https://stacktrack-ea9.pages.dev — open it on a phone and use
"Install app" (Android Chrome) or Share → "Add to Home Screen" (iOS Safari)
to install it like a native app. Works offline after first load.

## Features

- **Stack management** — medications and supplements with dose, scheduled
  times, and purpose groups (e.g. "Testosterone Support"); archive instead of
  delete, so history always survives
- **Automatic change history** — every add, edit, and removal is recorded
  with its date
- **Daily check-in** — today's items organized by time of day, tap to mark
  taken; per-item daily notes ("ran out of pills"); a day-level journal
- **Custom metrics** — define any number (1–10 ratings or free numbers with
  units), log once per day
- **Graphs with stack-change markers** — any metric over time, with
  color-coded vertical lines at every stack change (green = started,
  amber = adjusted, red = stopped; same-day group changes collapse into one
  marker). The point of the whole app: see what changed and what happened
  next.
- **Date navigation** — open any past day and view or correct it
- **Backup & sync** — export everything as JSON (full backup) or CSV (for
  spreadsheets); restore from backup; "Sync from file" merges another
  device's export (newest wins, never deletes) — carry data between your
  devices through your own cloud drive
- **Sorting** — stack views by group, name, time of day, or recently changed

## Privacy model

Your health data **never leaves your devices**. Everything is stored in the
browser's local database (IndexedDB) on each device. The hosted site serves
only the app's code — anyone with the link gets an empty copy of the app,
never anyone else's data. There are no accounts, no analytics, no telemetry.

StackTrack is a tracking tool, **not** a medical one: it gives no dosage
advice and checks no interactions, by design.

## Tech stack

React 19 + TypeScript (strict) + Vite, installable PWA (vite-plugin-pwa),
IndexedDB via Dexie, Recharts for graphs, Vitest + React Testing Library.

## Development

```bash
npm install        # first time
npm run dev        # http://localhost:5173

npm run lint       # ESLint
npm run typecheck  # tsc
npm test           # Vitest
npm run build      # production build (dist/)
```

Pushes to `main` run the full validation suite in GitHub Actions and, if
green, auto-deploy to Cloudflare Pages. See `RUNBOOK.md` for run, install,
update, and teardown procedures.

## Project organization

This repo is maintained with an AI coding agent driven by the instruction
set in `AGENTS.md` (+ `protocols/`). Day-to-day state lives in `HANDOFF.md`
(where things stand), `DECISION_LOG.md` (how we got here), and `BACKLOG.md`
(what's next).

## License

MIT — see `LICENSE`.
