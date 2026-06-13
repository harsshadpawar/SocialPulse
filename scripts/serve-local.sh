#!/usr/bin/env bash
# v0.2l: launchd entrypoint for the always-on local deploy. Runs in a login shell (see the plist) so
# node / npm / docker are on PATH. Waits for the Docker daemon (Colima/Docker Desktop may still be
# starting at login), brings the DB up, applies migrations, then serves the built app on one port.
set -euo pipefail

cd "$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)" # project root

echo "[socialpulse] $(date) starting…"

# Wait up to ~5 min for the Docker daemon.
for i in $(seq 1 60); do
  if docker info >/dev/null 2>&1; then
    echo "[socialpulse] Docker is up."
    break
  fi
  echo "[socialpulse] waiting for Docker daemon… ($i)"
  sleep 5
done

npm run db:up            # docker compose up -d --wait (Postgres)
npm run migrate:deploy   # apply migrations (no prompts, production-safe)

export NODE_ENV=production
echo "[socialpulse] serving on http://localhost:${PORT:-3001}"
exec npm --prefix backend run start   # node dist/index.js — serves API + built frontend on one port
