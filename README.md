# StackTrack

A local-first web app for tracking your medication & supplement stack — what
you take and when — alongside custom daily metrics and notes, so you can see
over time whether your stack is actually working.

**Live app:** https://stacktrack-ea9.pages.dev — open it on a phone and use
"Install app" (Android Chrome) or Share → "Add to Home Screen" (iOS Safari)
to install it like a native app. Works offline after first load.

## Features

- **Stack management** — medications and supplements with a dose and optional
  unit (shown together, e.g. "500 mg"), scheduled times, and one or more
  purpose groups per item (an item can sit under both "Bone" and "Immune");
  an optional persistent note that shows on the daily check-in; archive
  instead of delete, so history always survives
- **Automatic change history** — every add, edit, and removal is recorded
  with its date
- **Daily check-in** — today's items organized by time of day, tap to mark
  taken; a per-item note for the day ("ran out of pills"); a day-level
  journal. Sections collapse to keep a busy day tidy, and the layout is
  remembered
- **Tracking** — define what to follow each day: 1–10 ratings, free numbers
  with units, multi-number measurements (e.g. blood pressure as 120/80), and
  simple yes/no trackers; log once per day
- **Health events** — note one-off events like "Fever", "GI Doc Appointment",
  or "Appendectomy", tagged symptom / appointment / procedure / other,
  separate from your daily notes
- **Graphs** — any tracker over time, with color-coded vertical markers at
  every stack change (green = started, amber = adjusted, red = stopped;
  same-day group changes collapse into one marker) **and** at every health
  event. The point of the whole app: see what changed and what happened next
- **Date navigation** — open any past day and view or correct it
- **Backup & sync** — export everything as JSON (full backup) or CSV (for
  spreadsheets); restore from a backup; "Sync from file" merges another
  device's export (newest wins, never deletes); or turn on optional
  end-to-end-encrypted cross-device sync (Sync tab) with a shared passphrase
- **Sorting** — stack views by group, name, time of day, or recently changed

## Privacy model

Your health data **stays on your devices**. Everything is stored in the
browser's local database (IndexedDB) on each device. The hosted site serves
only the app's code — anyone with the link gets an empty copy of the app,
never anyone else's data.

Cross-device sync is **optional**. When you turn it on with a passphrase, your
data is end-to-end encrypted on your device before it's uploaded; the sync
server only ever stores ciphertext it cannot read. There are no accounts (just
a passphrase you choose), no analytics, and no telemetry.

StackTrack is a tracking tool, **not** a medical one: it gives no dosage
advice and checks no interactions, by design.

## Tech stack

React 19 + TypeScript (strict) + Vite, installable PWA (vite-plugin-pwa),
IndexedDB via Dexie, Recharts for graphs, Vitest + React Testing Library. The
optional sync backend is a Cloudflare Worker + D1 that stores only
end-to-end-encrypted data.

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
