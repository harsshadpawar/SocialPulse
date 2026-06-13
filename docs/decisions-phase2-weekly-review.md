# Phase 2 — Weekly Review · frozen decisions (2026-06-13)

Built functional-first in the Instrument system (no separate design pass — approved). The full loop:
derived summary + persisted reflection. Calm, input-focused, **never a performance dashboard** (PRD §7,
§5.3–§5.4). It answers: what was planned · what shipped · what got stuck · what to repeat · what to stop ·
what to change next week.

## D-48 · Reflection notes are persisted (they are NOT derived status)
A `weekly_review` table keyed by the Dubai ISO week start (`week_start_key`), columns `blockers`, `repeat`,
`stop` (default ''). Migration `20260613070000_phase2_weekly_review`. Unlike `day_closure`/media (which we
deferred because they were derivable or unproven), reflection is **user-authored learning** — it can't be
derived, and it is the whole point of the review, so it's stored. Read/written via raw SQL (`$queryRaw` /
`$executeRaw`), keeping the persistence boundary independent of the generated client.

## D-49 · The summary reads the SHARED metrics module ONLY — no recompute
Weekly Review's numbers (planned · shipped · on-time · late · missed · completion % · on-time % · execution
score) come entirely from `deriveWeeklyMetrics` (D-44) — the same module Calendar and Goals read. The module
was extended to expose the `onTime`/`late` breakdown so the surface reads it rather than recomputing. No
adherence or rate math lives in the Weekly Review code.

## D-50 · Navigation — no permanent fourth nav item
The header stays `Today · Calendar · Goals`. Weekly Review is reached **contextually**: a calm "Review this
week →" link on Today (only when there's weekly activity — `weeklyEffort.posts > 0`) and from Goals' progress
view. The page itself uses a back-header ("← Today"), like the editor — a surface you visit and leave. A
permanent Review nav can be reconsidered if usage proves it deserves first-class navigation.

## D-51 · Current Dubai week only · "Plan next week" is a placeholder handoff
No past-week picker, no historical browser. `getWeeklyReview` reviews the week containing `now`. "Plan next
week →" is a placeholder handoff that navigates to the Calendar (the planner) — it does not generate a plan
yet (approved).

## Voice
Input-focused and non-punitive throughout: "What you planned, what shipped … inputs you control, not
performance." Empty week reads "Nothing was scheduled this week — a quiet week is still a choice." No
"failed/behind/streak". Reflection prompts: "What got stuck?" · "What should repeat?" · "What should stop?"

## Tests
Shared metrics extended (onTime/late) with assertions added to `metrics.test.ts`; 96 backend tests green,
both typechecks clean. The summary is covered by the existing `metrics.test.ts` (one derivation); the
reflection persistence is a thin raw-SQL CRUD verified live.
