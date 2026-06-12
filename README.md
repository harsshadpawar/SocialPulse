# SocialPulse v0.1

Execution accountability cockpit for a solo creator. The app never publishes anything —
it tracks one loop: idea → platform post → Ready → Due → manual post → Mark Posted →
derived adherence result (On-time / Late / Missed).

Specs live outside this repo (`SocialPulse-Principle-Engineer/`). Selector contract: `docs/selector-spec.md`.

## Stack

React + Vite + TS · Express + TS + Prisma · PostgreSQL 16 (Docker, ARM64) · app runs natively, only the DB is containerized.

## Prerequisites

- Node 20+ (built on Node 22)
- Docker Desktop (Apple Silicon)

## First run

```bash
npm run setup          # installs root + backend + frontend deps
cp backend/.env.example backend/.env   # defaults match docker-compose
npm run dev            # db up (healthcheck-gated) → migrate → API :3001 + web :5173
npm run seed           # once: seeds the demo idea + LinkedIn draft
npm run smoke          # prints the seeded post back from Postgres
```

Open http://localhost:5173 — header should show "API: connected ✓".

## Scripts (root)

| Script | Does |
|---|---|
| `npm run dev` | db:up → migrate → backend (tsx watch) + frontend (vite) |
| `npm run db:up` / `db:down` | start/stop the Postgres container |
| `npm run migrate` | `prisma migrate dev` in backend |
| `npm run seed` | idempotent demo seed |
| `npm run smoke` | DB round-trip check |
| `npm test` | backend unit tests (vitest) |

## Layout

```
backend/   Express + Prisma API  (routes → services → prisma; domain/ is pure)
frontend/  Vite React client     (renders server-derived state; no status logic)
docs/      selector-spec.md      (authority for domain/selector + derivation)
```
