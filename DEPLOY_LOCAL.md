# Deploy SocialPulse locally (always-on, on your MacBook)

This runs SocialPulse as a single always-on app at **http://localhost:3001** — the Node backend serves
the built frontend *and* the API on one port, with Postgres in Docker. A `launchd` agent starts it on
login and restarts it if it stops. No terminal needs to stay open.

> Dev vs deploy: `npm run dev` is still your working mode (Vite on :5173, hot reload). This is the
> separate "just run it" mode. They don't conflict.

## Prerequisites (once)
- **Docker** running, set to **start at login** (Docker Desktop: Settings → General → "Start at login";
  Colima: `colima start` and it persists). The DB lives in Docker.
- Node + npm installed (you already have these).

## One-time setup

```bash
cd ~/Developer/SocialPulse/SocialPulseApp

# 1. Build the production app (frontend static + backend dist)
npm run build

# 2. Try it once in the foreground to confirm it works
npm run serve
# → open http://localhost:3001  (Ctrl-C to stop)

# 3. Install the always-on launchd agent
cp deploy/com.socialpulse.local.plist ~/Library/LaunchAgents/
launchctl load ~/Library/LaunchAgents/com.socialpulse.local.plist
```

That's it — SocialPulse now runs at **http://localhost:3001**, starts on every login, and auto-restarts.
Bookmark it (or `open http://localhost:3001`).

## Everyday commands

| Action | Command |
|--------|---------|
| Check it's running | `curl -s localhost:3001/api/health` → `{"status":"ok"}` |
| View logs | `tail -f ~/Library/Logs/socialpulse.*.log` |
| Stop it | `launchctl unload ~/Library/LaunchAgents/com.socialpulse.local.plist` |
| Start it | `launchctl load ~/Library/LaunchAgents/com.socialpulse.local.plist` |
| Restart after a code change | `npm run build` then `launchctl kickstart -k gui/$(id -u)/com.socialpulse.local` |
| Update DB schema | handled automatically on each start (`prisma migrate deploy`) |
| Wipe & reseed the DB | `docker compose down -v && npm run db:up && npm run migrate && npm run seed` |

## How it works
- `npm run build` → `frontend/dist` (static) + `backend/dist` (compiled API).
- On start, `app.ts` detects `frontend/dist/index.html` and serves it (with SPA fallback for client
  routes; `/api/*` still hits the API). Same-origin, so no proxy/CORS — the frontend's relative `/api`
  calls just work.
- `scripts/serve-local.sh` waits for Docker, runs `db:up` + `migrate:deploy`, then `node dist/index.js`
  with `NODE_ENV=production`. The launchd agent (`deploy/com.socialpulse.local.plist`) runs that script
  on login in a login shell (so `node`/`npm`/`docker` are on PATH) and keeps it alive.

## Notes & limits
- **Local only.** It binds to `127.0.0.1` (your machine). To reach it from your phone on the same Wi-Fi,
  set `BIND=0.0.0.0` in `backend/.env` and use your Mac's LAN IP — but only do that on a trusted network
  (there's no auth; SocialPulse is a personal single-user cockpit).
- **Port** is `3001` (from `backend/.env`); change `PORT` there if it clashes.
- If the app doesn't come up at login, it's almost always Docker not being ready — check
  `~/Library/Logs/socialpulse.err.log`; the script retries Docker for ~5 minutes.
