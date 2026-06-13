# v0.2g — "Plan week from this idea" · frozen decisions (2026-06-13)

Hub-and-spoke planning: one idea → a chosen set of platform-ready execution pieces. Architect-approved
as Package 1 (progressive, cadence-driven, guardrailed). **No schema change** (the model already holds
many posts per idea). SocialPulse never writes copy — the AI tool stays separate.

## D-53 · Plan Week — fixed-ladder proposer, progressive disclosure, effort guardrail

**Flow (no flat 11-format checklist):** platforms → cadence → fixed-ladder proposal → accept/remove →
schedule or save as drafts.

- **Proposer = fixed ladders** (transparent, testable; not effort-budget). Cadence = how deep down each
  platform's curated spoke order:
  - LinkedIn — Light: Text · Medium: +Carousel · Heavy: +Video
  - YouTube — Light: Short · Medium/Heavy: +Long
  - X — Light: Post · Medium: +Thread · Heavy: +Video
  - Instagram — Light: Reel · Medium: +Carousel · Heavy: +Image
  The proposal **excludes the hub's own (platform, format)** so it never duplicates the source post.
- **Progressive disclosure** (reduce cognitive load): platforms first, then cadence, then the proposed
  list — never all formats at once. Cadence default = **Light**.
- **Scheduling** = editable proposed dates (cadence sets a spread gap: light 3d · medium 2d · heavy 1d),
  every date editable/clearable per piece. Plus a **"Save as drafts"** escape (create the pieces with no
  dates — commit content, not dates). No fixed one-per-day imposition.
- **Effort guardrail** (the on-brand bit): a live "N pieces · M effort points · {load} load" line; at full
  load it nudges "heavy; consider removing one." Reduce scope, never push harder.
- **Caption seeding** (D5): source post caption if non-empty, else `coreMessage`. No AI generation.
- **Model**: relaxes the old one-post-per-platform-per-idea rule (hub-and-spoke wants several formats per
  platform). Bulk-create is `POST /api/posts/:id/plan-week` { pieces[] }, transactional, logs `created`.
- **Naming**: "Plan week from this idea" — a planning assistant, not a content factory.

## Scope boundaries honored (D6)
No schema change · no AI copy generation · no analytics-reactive "expand winner" · no auto-20 factory ·
no flat checklist · no New-Idea platform multiselect. Editor entry "Plan week →"; new route
`/posts/:id/plan-week`.

## Tests
Backend tsc + 96 tests green; frontend tsc clean. Verified live: LinkedIn+YouTube · Medium proposed
Carousel + Short + Long (hub Text excluded), guardrail read "full load — heavy", create → pieces landed
on their scheduled days on the Calendar.
