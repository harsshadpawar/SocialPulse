# v0.2b — "Daily rhythm" · frozen decisions (2026-06-13)

Scope: a derived "Today's work is done" state · Quick Start (caption seed). Zero schema changes,
zero migration. Sequenced after v0.2a (tag v0.2a). Day-level persistence explicitly deferred (D-36).

## D-34 · "Today's work is done" is DERIVED, never stored
Closure is not a status on a post and not a stored day record — it is read-time truth (ADR-2).
`deriveWorkIsDone(posts, now, tz)` is true when **nothing is actionable today** AND **at least one
post went live on today's Dubai day**. "Actionable today" = selector classes 1–4 (Due, unacknowledged
Missed, Ready+planned-today, loose draft), exposed as the pure `isActionableToday` helper so it can
never drift from the selector. A clear day with nothing posted stays `empty` ("Today is clear"), not
`done`. Future-staged drafts (targeted a later day) do not block done — prep ≠ pending. Returned on
TodayView as `workIsDone`; the client owns the words (ADR-3).

## D-35 · Quick Start (renamed from "Simplify"): seed caption from core message
A blank-caption draft can move with one tap: `caption := coreMessage.trim()`. Gated by the derived
capability `canQuickStart` (`!posted ∧ draft ∧ caption blank ∧ coreMessage non-empty`). It advances
the sub-state `needs_caption → needs_schedule` and **stops there** — never schedules, marks ready, or
posts (those stay the creator's attestations). Endpoint `POST /api/posts/:id/quick-start`. Surfaced
in two places: the Today draft card (replacing the dead-end "Add caption first" helper) and the
editor's Prepare stage. **Not logged** to `adherence_event` — caption edits aren't in ADR-5, and
adding an event type is a schema change we're deferring (D-36).

## D-36 · Day-level persistence DEFERRED until 30–50 real cycles
The original v0.2b framing proposed a `day_closure` table (stored closure attestation + close/reopen
ritual). **Rejected for now.** Rationale: introducing day-level persistence before we have real usage
data risks modelling a ritual we don't yet understand. We collect 30–50 real posting cycles first;
the derived `workIsDone` (D-34) gives the calm end-of-day reflection with no storage commitment. If
the data shows a manual close/reopen is wanted, we revisit with `day_closure` then.

## Approved microcopy (tone laws: calm, non-punitive)
Work-done — eyebrow: "Day done" (success). · command: "Today's work is done. Rest — tomorrow's plan
is here when you are." · sub (recap): "{N} posted today · {M} this week."
Quick Start — action: "Quick Start" · helper: "Start from your core message — refine after."

## Tests
+18 backend tests (77 total): `dayState.test.ts` (isActionableToday + deriveWorkIsDone golden cases —
posted-today, loose draft, due outstanding, future prep, miss ack/unack, previous-day) and
`capabilities.test.ts` (canQuickStart matrix). No schema, no migration — `tsx`/Vite hot-reload only.
