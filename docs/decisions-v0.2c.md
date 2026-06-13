# v0.2c — "Width" · frozen decisions (2026-06-13)

Scope: multi-platform repurpose · derived effort scoring · weekly effort summary. **Zero schema
changes, zero migrations.** Media (a persisted `media_reference` + a `needs_media` readiness step)
was scoped and **deferred to backlog** — see "Rejected" below. Sequenced after v0.2b.

## D-37 · Multi-platform repurpose — reuse the 1-idea→N-posts model, no schema
The ContentIdea → PlatformPost relation already exists; v0.1 only ever created the single LinkedIn
post. Repurpose adds the behavior: `POST /api/posts/:id/repurpose { platform }` spawns a sibling
PlatformPost on another platform under the same idea, using that platform's v0.1 format (the fixed
`PLATFORM_FORMATS` pairs). **One post per platform per idea** (409 `platform_exists` otherwise); the
editor only offers platforms not yet used (`repurposeTargets` on PostView, derived from the idea's
existing posts). Logs a `created` event (existing ADR-5 type — no schema change). The selector already
ranks across all posts, so Today and the planned-today counts absorb siblings with no selector change.

**Refinement (architect review):** the sibling caption **seeds from the SOURCE post's caption**, and
falls back to `ContentIdea.coreMessage` only when the source caption is blank. Real repurposing starts
from existing copy, not a blank page.

Repurpose stays **post-hoc only** — New Idea keeps creating the single LinkedIn spine (no platform
multiselect at capture). Build the first post, then repurpose outward. Matches the validated v0.1 flow.

## D-38 · Effort is DERIVED from format — never stored
`deriveEffort(format)` is a pure mapping (PRD §6.2): `text_post`/`short_post` → low, `reel` → medium,
`short_video` → high. Exposed as `effortScore` on PostView. **Weekly capacity** (CS-12) is also
derived: `deriveWeeklyEffort` sums effort weights (low 1 · medium 2 · high 3) over posts targeted in
the current Dubai ISO week (reuses the v0.2a `isSameWeek` helper) and tiers it light (≤3) / moderate
(≤6) / full (>6). Surfaced as a calm, dim line under the targets strip — informational, never a nag.
No columns, fully in the derive-don't-store spirit; a per-post effort *override* is a column we add
only if real usage demands it.

## Rejected for v0.2c · Media (was D-39/D-40)
A persisted `media_reference` column plus a `needs_media` readiness step (Caption → Media → Schedule
→ Ready) was scoped but rejected. Reason: it expands readiness derivation, capabilities, gating,
selector behavior, Today logic, and tests — larger than the single-column change implies, and we have
**not yet validated demand** for media management inside SocialPulse. We have validated demand for
multi-platform execution and capacity awareness; those ship now. Media stays a backlog candidate until
real usage shows the need. Principles applied: derive before store · prove before expanding · build
the spine, not the future.

## Tests
+5 backend tests (82 total): `effort.test.ts` (deriveEffort mapping + deriveWeeklyEffort: empty week,
weighted sum, other-week exclusion, untargeted-drafts-excluded, load tiers). Frontend tsc clean.
Verified live: effort chip + weekly line render; repurpose to X created an X sibling seeded from the
source LinkedIn caption and navigated to it.
