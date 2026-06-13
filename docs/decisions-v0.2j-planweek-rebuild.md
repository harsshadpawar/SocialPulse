# v0.2j — Plan Week rebuilt to the approved hi-fi · frozen decisions (2026-06-13)

Built to the designer's package (`SocialPulse-Principle-Engineer/design_handoff_socialpulse_v0.1/`,
`README_PLANWEEK_v0.2i.md` + 11 hi-fi boards). Frontend only — **no schema change**. Supersedes the
functional-first Plan Week (v0.2g) and the v0.2i patches (D-55…D-59), keeping their intent.

## D-60 · Custom Instrument date+time control
New `frontend/src/components/DateTimePicker.tsx` replaces native `datetime-local`. One popover:
Sunday-first month grid with ‹ › month nav, a scrollable 30-min time list (auto-scrolls to the
selected slot), and a Done footer. Trigger button shows "{D Mon} · {h:mm AM}" with a calendar glyph and,
when the row was hand-edited, a small accent dot. Value stays a local `'YYYY-MM-DDTHH:mm'` string (Dubai
clock, interpreted local at create as before). Consistent across browsers, on-brand.

## D-61 · Apply-to-all scheduling — per-row edits persist (the reset bug, designed out)
The old `Start` field silently regenerated **every** row on change, wiping per-row times. Replaced by:
- A **baseline** ("Schedule all — from {date·time} · spacing {every N days}") that does **nothing on
  its own**. Changing it never rewrites rows.
- **"Apply to all"** is the *only* action that lays rows out from the baseline (spacing days apart).
- **Per-row edits persist** (accent dot) and survive platform/cadence toggles — reconciliation keeps any
  existing row by `platform|format` and only assigns a baseline date to brand-new pieces.
- **Apply to all respects edits:** if any row was hand-edited it asks once (confirm) before overwriting;
  default = skip edited rows, fill only untouched ones.

## D-62 · Calendar month cell ×count badge
Multiple pieces of one idea on a day collapse to a single line with a **×count** badge (`groupByIdea`),
so the month overview no longer shows duplicate-looking rows. Week card already shows Platform · Format
(D-58).

## D-63 · Pinned hub caption, capture "just write the post", calm states, mobile
- **Pinned hub caption** above the proposal: pin glyph, idea title, Platform · Format, "Already a post"
  pill — different *in kind* from spoke rows (no checkbox/card), not removable, not counted. Single
  signal "Already a post" (dropped the redundant "THIS IDEA" tag).
- **Capture** keeps the fast path: primary "Next → plan the week" + a quiet secondary **"just write the
  post"** that creates the idea and routes straight to the editor.
- **States:** hub-only dashed hint (no buttons); overloaded effort line shifts to the calm late/amber
  tone, never red, never blocking; **Save as drafts** now shows an inline success strip and **stays**
  (drafts are undated, so bouncing to the calendar looked empty); non-destructive **error**
  ("your picks and times are saved") with Retry + Save as drafts; **loading** button "Creating N…".
- **Mobile (≤sm):** rows stack (label line, then the date+time control), chips wrap, the effort line +
  actions become a sticky footer.

## Verification
Frontend `tsc` + production `vite build` clean. **Verified live:** custom picker (grid + time list +
Done); the reset bug is gone — a row hand-edited to 12 Jun · 9:30 kept it across a Heavy→Medium cadence
switch; Apply-to-all declines-confirm keeps edited rows and spreads the rest correctly (14→15→16);
Create persisted all three pieces at 09:00 Dubai (05:00Z); capture "just write the post" present; month
×count badges render. Calendar week card Platform·Format eyebrow still good.

**Bug caught + fixed in live testing:** `Apply to all` declared its `slot` counter *outside* the
`setPieces` updater. React StrictMode double-invokes updaters in dev, so the counter kept climbing across
both runs and over-spread the dates (18/19 instead of 15/16). Fixed by moving `let slot = 0` inside the
updater so each invocation resets — the updater is now pure.

## Parked (unchanged)
Dedupe guard for repeated planning (multi-post-per-idea stays allowed, D-37). Cadence default Light and
whether 09:00 should later derive from the user's typical posting time — easy follow-ups.
