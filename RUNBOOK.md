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
