# How to run StackTrack
<!-- Maintained by the agent. If these steps don't work, tell the agent:
     "the runbook is broken" — fixing it takes priority. -->

## First time on a new machine
1. Install Node.js 20 or newer (https://nodejs.org)
2. In a terminal, from the project folder: `npm install`

## Start it
1. Open a terminal in the project folder
2. Run: `npm run dev`
3. Open http://localhost:5173 in your browser (works on a phone on the same
   network too — the terminal prints a Network URL if you start with
   `npm run dev -- --host`)

## You should see
The teal "StackTrack" header with today's date, and a "Today" card saying
your stack is empty.

## Stop it
Press `Ctrl+C` in the terminal where it's running.

## If it doesn't start
- `npm: command not found` — Node.js isn't installed; see "First time" above.
- `Port 5173 is in use` — another copy is already running; check other
  terminal windows, or tell the agent.
- Anything else — copy the error text and tell the agent.

## Deployed version
- Live at: https://stacktrack-ea9.pages.dev
- Code repository: https://github.com/LarsonRogers/StackTrack (private)
- What's on the server: the app's CODE ONLY — all health data stays in each
  device's own browser storage (see DECISION_LOG.md 2026-06-12 gate entry).
- Updating the live app (primary path): commit and push to `main` —
  GitHub Actions runs lint/typecheck/tests/build and, only if all pass,
  deploys automatically (repo → Actions tab shows progress).
- Manual fallback (run from the project folder):
  1. `npm run build`
  2. `npx wrangler pages deploy dist --project-name=stacktrack --branch main`
- Installed phones pick the new version up automatically on next open
  (open the app, then close and reopen once if it looks stale).

## Install on a phone
- Android (Chrome): open https://stacktrack-ea9.pages.dev → tap the
  "Install app" banner, or menu (⋮) → "Add to Home screen" → Install.
- iPhone (must use Safari): open the URL → Share button → "Add to Home
  Screen" → Add.
- The phone copy starts EMPTY. To move data the first time: Stack tab →
  Export JSON on the old device, then Stack tab → Import backup on the phone.
- To carry changes between devices afterwards: Export JSON on one device
  (drop it in your cloud-drive folder), then Stack tab → "Sync from file"
  on the other. Sync MERGES (adds + newest-wins updates, never deletes);
  "Import backup" REPLACES. One quirk to know: a check you removed on one
  device can reappear after a sync if the other device's file still has it.

## Sync server (item 13)
- Live at: https://stacktrack-sync.el-m-rogers.workers.dev (health check:
  open /health — should show {"ok":true})
- What it stores: ONLY encrypted blobs + timestamps — no readable health
  data, ever (E2E encryption happens on your devices).
- Redeploy after changes: `npx wrangler deploy -c workers/sync/wrangler.toml`
- Local dev: `npx wrangler dev -c workers/sync/wrangler.toml --local`
- Schema changes: `npx wrangler d1 execute stacktrack-sync --remote
  --file=workers/sync/schema.sql -c workers/sync/wrangler.toml`

## Take it down
App hosting:
1. `npx wrangler pages project delete stacktrack` (run from the project
   folder; it asks once to confirm — type the project name)
2. Verify it is actually gone: open https://stacktrack-ea9.pages.dev —
   you should get a "nothing is here" / 404 page. If the app still loads,
   the teardown FAILED — tell the agent.
3. Note: phones that already installed the app keep working offline from
   their cache; remove the app from the phone like any other app (its
   local data is deleted with it — export first if you want it).

Sync server:
1. `npx wrangler delete -c workers/sync/wrangler.toml` (removes the Worker)
2. `npx wrangler d1 delete stacktrack-sync` (removes the database and ALL
   encrypted sync data — devices keep their local copies)
3. Verify: open https://stacktrack-sync.el-m-rogers.workers.dev/health —
   it must FAIL to load. If it answers, teardown FAILED — tell the agent.
