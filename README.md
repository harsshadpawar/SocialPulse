# SocialPulse

**A calm, personal content-execution cockpit for solo creators.**

SocialPulse helps one creator show up consistently across LinkedIn, X, YouTube, and Instagram. It
**plans, reminds, and tracks adherence** — it does *not* generate your content and it does *not*
auto-publish. You write your own copy and post manually; SocialPulse keeps you on rhythm and shows you
your consistency over time.

Its guiding principle is **"do less, well" — calm and non-punitive.** Nothing here grades or shames you;
a missed day is reduced scope, not a red mark. There is no red in the entire product.

> Open source under **GPLv3** (see [License](#license)).

---

## What it does

- **Today** — your execution loop. Capture an idea, prepare the post, get a calm reminder, mark it
  posted, and see your adherence — all in one focused surface.
- **Plan week (hub-and-spoke)** — turn one idea into a week of platform-ready pieces. Pick platforms and
  a cadence (Light / Medium / Heavy); SocialPulse proposes the spread, you accept/remove and schedule
  each piece with date **and** time. You paste your own copy later.
- **Calendar** — week and month views with navigation; every piece shows its platform and format.
- **Goals** — set a realistic weekly capacity and targets; an overloaded week gets a gentle "consider
  removing one," never an alarm.
- **Weekly Review** — a derived summary of the week plus a short reflection (blockers / repeat / stop).
- **Consistency Reports** — your streak, a 12-week completion trend, a 6-month rollup, and per-platform
  consistency, in one shared progressing-green scale. Built to encourage, never to shame.

## Tech stack

| Layer | Stack |
|-------|-------|
| Backend | Node + Express + TypeScript, Prisma ORM, PostgreSQL (Docker) |
| Frontend | React + Vite + Tailwind CSS v4 (CSS-first tokens) |
| Tests | Vitest (pure-domain logic) |

State is **derived, not stored** wherever possible; the server derives status, the client owns the
words. Timezone is configurable (defaults to `Asia/Dubai`).

---

## Quick start (development)

**Prerequisites:** Node 20+, npm, and Docker (for PostgreSQL).

```bash
git clone https://github.com/harsshadpawar/SocialPulse.git
cd SocialPulse

cp backend/.env.example backend/.env     # set DATABASE_URL etc. (defaults match the bundled DB)

npm run setup                            # install root + backend + frontend deps
npm run dev                              # DB up + migrate + API (:3001) + web (:5173)
npm run seed                             # once: load baseline seed data
```

Open **http://localhost:5173**.

Useful scripts:

```bash
npm run dev          # full dev environment (hot reload)
npm test             # backend test suite
npm run db:up        # start the Postgres container
npm run migrate      # apply database migrations
npm run seed         # load baseline seed data
```

## Run it always-on (local deployment)

To run SocialPulse as a single always-on app on your own machine (one URL, starts on login), see
**[DEPLOY_LOCAL.md](DEPLOY_LOCAL.md)** — the backend serves the built frontend on
`http://localhost:3001`, with a `launchd` agent keeping it alive.

```bash
npm run build        # build frontend + backend
npm run serve        # production server on http://localhost:3001
```

---

## Project structure

```
backend/    Express API, Prisma schema/migrations, pure domain logic + tests
frontend/   React app (Vite), Instrument design system, pages & components
deploy/     launchd agent for the always-on local deploy
scripts/    serve-local.sh and tooling
```

## Configuration

Backend reads `backend/.env` (see `backend/.env.example`):

| Variable | Default | Purpose |
|----------|---------|---------|
| `DATABASE_URL` | — | PostgreSQL connection string |
| `PORT` | `3001` | API / deploy port |
| `BIND` | `127.0.0.1` | bind address (local-only by default) |
| `APP_TIMEZONE` | `Asia/Dubai` | the product clock |

> SocialPulse is a personal, single-user tool with **no authentication** — keep it bound to `127.0.0.1`
> and don't expose it to untrusted networks.

---

## Contributing

Issues and pull requests are welcome. Because this project is GPLv3, contributions are accepted under the
same license. Please keep the **calm, non-punitive** product voice — no shaming mechanics, and never
introduce a "red / you failed" state.

## License

SocialPulse is licensed under the **GNU General Public License v3.0 (GPLv3)** — see the [LICENSE](LICENSE)
file.

GPLv3 is a **copyleft** license: the project is free and public, and anyone may use, study, and modify
it — **but anyone who distributes a modified version must also release their source under GPLv3.** This
keeps every fork open and prevents closed-source or proprietary commercial forks. If you build on
SocialPulse, your version stays open too.

Copyright © 2026 Harsshad Pawar.
