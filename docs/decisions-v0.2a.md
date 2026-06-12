# v0.2a — "Deepen the loop" · frozen decisions (2026-06-12)

Scope: readiness sub-states · due-but-not-ready prompt · transition logging · post-count targets ·
New-Idea entry point. Sequenced after formal v0.1 close (tag v0.1.0). v0.2b/c/d remain parked.

## D-30 · Readiness sub-states are DERIVED (option a)
No new fields, no stored enum (ADR-2 discipline). Sub-state refines Draft only:
`needs_caption` (caption blank) → `needs_schedule` (no target) → `ready_to_mark` (complete, awaiting Mark Ready).
Media dimension (`needs_media` + media_reference) deferred to v0.2c with multi-platform repurpose.

## D-31 · Due-but-not-ready is a derived flag, not a new card state
`dueNotReady = posting_status ∈ {due} ∧ readiness = draft`. cardState stays 5-valued ('draft');
the flag swaps command/eyebrow/card copy. Server returns the flag (ADR-3); client owns the words.

## D-32 · Post-count targets: daily + weekly, counting POSTED
Hourly rejected (incompatible with solo-evening reality; would make the cockpit nag).
A period's count = posts with actual_datetime in that Dubai day / ISO week — late still counts
(completion ≠ punctuality, PRD §5.3). Display: dim strip "Today 1/1 · This week 3/5" under
"N of N planned today". Informational only — no red, no streaks, no nagging.

## D-33 · Targets are data, edited inline (no settings screen — law upheld)
One-row table `posting_target` (`daily_target int NULL`, `weekly_target int NULL`, `updated_at`).
NULL hides that period; both NULL hides the strip. Click the strip to edit in place.

## ADR-5 · Transition log records USER ACTIONS only
Table `adherence_event` (append-only): created · target_edited · marked_ready · marked_posted ·
actual_edited · missed_acknowledged. Derived detections (Due reached, grace expired) are NEVER
logged — they are read-time findings; logging them would duplicate per read and violate ADR-2.
Writes happen in the service layer beside each mutation (the applyTransition seam). No UI in
v0.2a — this is Weekly Review's substrate (Phase 2).

## Approved microcopy (tone laws: calm, non-punitive, blame the plan)
Due-but-not-ready — command: "Your {platform} {format-noun} is due — it isn't marked ready yet."
· sub: "Finish the last step and mark it ready — it can still go out."
· card: "This post hit its time while still in draft. Finish it, mark it ready, and it can still go live."
· eyebrow: "Due · not ready" (accent, pulse).
Sub-state commands — needs_caption: "One post is planned for today — it still needs a caption." (verbatim v0.1)
· needs_schedule: "The caption is written — now pick when it goes live."
· ready_to_mark: "Everything's in place — mark it ready."
Targets strip: "Today 1/1 · This week 3/5".

## Slices
v0.2a-1 backend: schema (adherence_event, posting_target) + derived sub-states/flag + event writes + API.
v0.2a-2 UI: sub-state & due-not-ready copy, eyebrow, New-Idea header entry.
v0.2a-3 targets: GET/PUT target endpoints, counts in /api/today, editable strip.
