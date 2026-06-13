# v0.2h — Calendar navigation + Month view · frozen decisions (2026-06-13)

Motivated by a real gap: a Heavy Plan-Week spread pieces across 14–23 Jun, but the calendar only showed
the current week, hiding most of the plan. Now the calendar navigates and offers a month overview.
**No schema change.**

## D-54 · Anchor-based navigation + a Month view; status always vs the real clock

- **Week view is now navigable.** `GET /api/calendar?anchor=<ISO>` shows the week containing the anchor,
  with `prevAnchor` / `nextAnchor` (±7 days) and `isCurrentWeek`. The header gained **‹ › + Today** and a
  **Week / Month** toggle.
- **Month view (new).** `GET /api/calendar/month?anchor=<ISO>` returns a 5–6 week Mon-first grid for the
  month containing the anchor (leading/trailing days flagged `inMonth: false` and dimmed). Each day lists
  **compact** posts (platform dot + title, status-coloured left border) — an *overview*, deliberately
  without the capacity meter / overload card (those stay a per-week question). `prevAnchor`/`nextAnchor`
  step ±1 month. Click a post → editor.
- **The key correctness rule:** effort/realism are computed for the *displayed* week (a new optional
  `weekRef` selects the week in `deriveWeeklyEffort` / `deriveWeekRealism`), but **post status (missed/
  posted/due) is always derived against the real `now`** — so a navigated *future* week reads its posts as
  planned, not missed, and a past week shows real misses. `weekRef` defaults to `now`, so every existing
  current-week caller (Today, Goals) is untouched.
- Month view was the v0.2d-deferred "build only if multi-week planning becomes necessary" — it now is
  (Plan Week makes multi-week plans routine). Built functional-first in the Instrument style.

## Tests
Backend 96 tests green (the optional `weekRef` is backward-compatible); both typechecks clean. Verified
live: Month shows the full 14–23 Jun plan at a glance; ‹ › moves weeks/months; Today jumps back; the
Today shortcut shows only when off the current period.
