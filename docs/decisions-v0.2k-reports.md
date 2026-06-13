# v0.2k — Consistency Reports · frozen decisions (2026-06-13)

Built to the designer's package (`design_handoff…/README_REPORTS.md` + 6 hi-fi boards). A new surface:
**Reports** (4th nav). Read-only aggregation over data we already hold — **no schema change, no external
APIs, no AI**. Calm and non-punitive: **never red**, leads with what's working.

## D-64 · Consistency Reports

**Backend — pure aggregation (`domain/reports.ts`, `deriveConsistencyReport`).** Per ADR-3 it derives
**state + numbers only**; the client owns every word. Computed from the same adherence/grace truth
Calendar & Goals read, so Reports can never disagree with them:
- **12-week completion trend** — completion % (published ÷ planned) per week, bucketed by target week.
- **Streak** — trailing consecutive weeks meeting **light cadence** (locked: ≥1 published that week — the
  kindest, most streak-protective bar; a single clearly-marked rule, one-line to tighten to capacity or
  post-count later).
- **6-month rollup** — weeks-hit, posts, on-time % per month.
- **Per-platform consistency** — weeks-hit of N for each platform the creator actually used.
- **Gentle patterns** — only in the rich state and only with honest signal (reliable weekday needs a
  clear mode of ≥3 posts; prepare-ahead surfaces if it happened). Never a "you always miss X."
- **State** — `early` (<2 wks or nothing published) · `sparse` (<4 wks) · `rough` (recent weeks mostly
  missed / streak 0) · `rich`. Same layout for sparse/rough/rich; the words and which sections show differ.
- Capacity reference line = `completionTargetPct` (or 80 default).

Service `getConsistencyReport` + route `GET /api/reports` (registered in `app.ts`).
**6 vitest cases** cover empty→early, one-week→early, rich (streak 5 / full trend / per-platform),
rough (streak 0, months still show the stronger past), completion math, and the capacity line.

**Frontend — `pages/ReportsPage.tsx` (+ 4th nav tab, `/reports` route).** Renders to the hi-fi: streak
headline + week-dots, green completion bars with a dashed capacity line (one `greenFor(pct)` scale
shared with the capacity meter & effort tags — never red), months rollup, per-platform bars, gentle
patterns. All states: early (ghost-bar encouragement), loading (calm skeleton), sparse/rough/rich. The
**verdict wording is composed on the client** from the server state + numbers (rich/rough/sparse).

## Verification
Backend **102 tests green** (96 + 6); **tsc clean** both ends. (`vite build` is currently blocked by a
sandbox filesystem quirk clearing `dist` — not a code issue; tsc is the type gate.) **Live click-through
pending a dev-server restart** — to exercise: the early state on the freshly-seeded DB, then inject a few
published posts across past weeks to see the rich report render.

## Parked / owner decision (non-blocking)
The streak bar is **light cadence** per the locked spec. If you want it stricter (weekly capacity or
post-count target), it's a one-line change in `domain/reports.ts` (the `published >= 1` rule) and the
headline number. Weekly-Review reflection thread and external-platform analytics remain out of scope.
