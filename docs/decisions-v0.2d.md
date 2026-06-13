# v0.2d — "New surfaces: Calendar + Goals" · frozen decisions (2026-06-13)

Built from the design handoff (`design_handoff_socialpulse_v0.1`: START_HERE → README_PLANNING_v0.2d →
DesignBrief_v0.2d → `hifi-v0.2d/`). Two surfaces only — Calendar Week View + Goals (Setup + Progress) —
plus a 3-way nav. The do-NOT-build list (Month view, Weekly Review, analytics, Settings screen) is honored.

## D-43 · Commitments extend the one-row posting_target table (one migration)
Goal Setup persists five fields; one already existed (`weeklyTarget` = "Publish this week"). Migration
`20260613060000_v02d_commitments` adds `prepare_ahead_target`, `completion_target_pct`, `missed_ceiling`,
`weekly_capacity` — all nullable (a commitment not set is simply not judged). Still one inline-edited row,
no settings screen (capacity is one stepper in Goal Setup). `daily_target` stays the targets-strip field
and is never touched by Goal Setup.

## D-44 · ONE shared weekly-metrics derivation (non-negotiable constraint)
`deriveWeeklyMetrics` (pure) computes published / preparedAhead / completion / missed / executionScore
(PRD §5.3) for the Dubai ISO week. Calendar and Goals both read it — never recompute per screen — so a
Goal card can never disagree with the Calendar. The capacity meter's "used" reuses the v0.2c weekly-effort
score; "cap" is `weeklyCapacity`. Verified live: Goals "Published 3" matched the Calendar's grid.

## D-45 · Calendar realism / overload rule (server facts, client words, never red)
`deriveWeekRealism` returns the facts — total effort, capacity, the heavy day (≥2 high-effort on one
Dubai day), missed count — and a derived `state` (empty/healthy/overload/missed). Overload fires when
effort > capacity OR a day has ≥2 high-effort posts (§7). The client renders the calm accent realism card
naming the specific reduce-scope fix ("move one Sunday post…"); if capacity is unset, the soft form. The
calendar is current-week only (the hi-fi shows one week, no nav arrows; Month is deferred). Calendar posts
link to the existing editor, where the v0.1 Resolve/Mark-Posted flow already lives (reused, not rebuilt).
The overload actions are "Open the plan" (→ the heavy post's editor) + "Keep as is" (dismiss) — a small
simplification of the 3-button hi-fi, since real "reduce/drop" needs no new destructive endpoint.

## D-46 · Navigation: Today · Calendar · Goals
One restrained segmented header switch (`NavHeader`, ported from the hi-fi). Today stays the home /
emotional center and keeps "+ New idea"; Calendar and Goals are surfaces you visit to plan, then leave.
No sidebar, no badges. New routes `/calendar`, `/goals`.

## D-47 · Goal Progress verdict — non-punitive
"On rhythm" (success) vs "Ran short" (amber, never red). `deriveVerdict` returns Ran-short ONLY when
missed reaches the ceiling, or the week's posts are ALL resolved (posted or missed) and completion fell
short. Mid-week incomplete progress never reads as Ran-short. Verified live: completion 50% under an 80%
target still showed "On rhythm" because video drafts were still pending.

## Tests
+14 backend tests (96 total): `metrics.test.ts` (weekly metrics + verdict matrix), `planning.test.ts`
(overload rule incl. the canonical Mon×1/Tue×2 capacity-5 case). Frontend tsc clean. Verified live: the
acceptance test passed — overloaded week surfaces at a glance, realism warning fires, fix is "reduce one",
no punitive word; Goals reads the shared metrics with the calm verdict.
