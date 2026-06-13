# Design handoff — v0.2i UI changes (for the designer)

**For:** SocialPulse designer · **From:** engineering · **Date:** 2026-06-13
**Status:** built **functional-first** in the Instrument style and shipping; this doc hands the visual
refinement to you. Nothing here is final-pixel — treat the wireframes as *what it does today*, and make
it *look right*. Decision IDs (D-xx) reference `docs/decisions-v0.2i-plan-week-fixes.md`.

**Design language to stay inside:** "Instrument" — calm, non-punitive, paper/ink palette, never red,
generous whitespace, serif command headings + small uppercase eyebrows. Tokens live in
`frontend/src/styles.css` (`@theme`). Asia/Dubai timezone, 30-min grace window are product invariants.

---

## 1) Capture now flows into Plan Week (D-56)

**What changed:** after "New idea", the primary button no longer opens the post editor — it opens
**Plan Week**. Copy changed:
- CTA: `Next → create the LinkedIn post` → **`Next → plan the week`**
- Sub: "…The post itself comes next." → **"…Planning the week comes next."**

**Why:** hub-and-spoke — decide the week's spread before writing any single piece. The hub draft still
exists; its caption is written later from Today → editor.

```
CAPTURE
What's the idea?
Title and core message — that's all. Planning the week comes next.
┌─────────────────────────────────────────┐
│ TITLE        [ …………………………………………… ]      │
│ CORE MESSAGE [ …………………………………………… ]      │
│              [   Next → plan the week  ] │   ← was "create the LinkedIn post"
└─────────────────────────────────────────┘
```

**Open design question:** capture currently has no visible affordance to skip planning and go straight
to writing. Is "Plan week" always the right next step, or do we want a secondary "Just write the post"
link? (Eng default today: always Plan Week.)

---

## 2) Plan Week — hub context row (D-57)  ← biggest change, needs the most love

**Problem it solves:** landing on a LinkedIn idea at Light proposed *nothing* (the hub's own piece is
excluded), so the screen looked dead and users thought clicks were broken. Now the **hub renders as a
locked context row** at the top of the proposal, so the list is never empty and the proposed spokes
read as additions around the idea that already exists.

**Behaviour:**
- Hub row = the idea's own post. Disabled checked checkbox, muted text, `THIS IDEA` tag,
  `already created` on the right. **Not removable, not re-created, not counted** in the effort total.
- Effort line counts **new** pieces only: `5 new pieces · 11 effort points · full load`.
- When there are 0 new pieces: hide the action buttons, show a calm hint instead.

```
PROPOSED — ACCEPT OR REMOVE                         Start [14/06/2026, 09:00 ▾]
┌───────────────────────────────────────────────────────────────────────────┐
│ ☑̲(locked) ● LinkedIn · Text post   [THIS IDEA]              already created │ ← hub, greyed
│ ☑ ● LinkedIn · Carousel   MED                       [14/06/2026, 09:00 ▾]   │
│ ☑ ● LinkedIn · Video      HIGH                      [15/06/2026, 09:00 ▾]   │
│ ☑ ● X · Post              LOW                        [16/06/2026, 09:00 ▾]   │
└───────────────────────────────────────────────────────────────────────────┘
              5 new pieces · 11 effort points · full load — heavy; consider removing one.
              [        Create 5 pieces        ]   [ Save as drafts ]
```

Zero-new-pieces state (hub only, e.g. LinkedIn + Light):
```
┌───────────────────────────────────────────────────────────────────────────┐
│ ☑̲(locked) ● LinkedIn · Text post   [THIS IDEA]              already created │
└───────────────────────────────────────────────────────────────────────────┘
        No new pieces yet — add another platform, or bump the cadence to Medium or Heavy.
        (no action buttons)
```

**Open design questions for you:**
- The hub row is currently a faint grey variant of a normal row. Should it look more clearly
  *different in kind* (e.g. no row chrome, a "pinned" affordance, or sit above the card as a caption)?
- `THIS IDEA` tag vs `already created` text — is one redundant? Pick the clearer single signal.
- Effort line says "5 **new** pieces" — confirm the word "new" reads right next to a list that visually
  includes the hub.

---

## 3) Plan Week — schedule date **and time** (D-59)

**What changed:** the per-piece picker and the Start field were date-only (time silently 09:00). They
are now **date + time** (`datetime-local`), default 09:00, editable per row. Time is a critical field
(posting time matters), so it's now explicit.

**Design implications:** the datetime control is wider than the old date control — rows are tighter.
Needs a layout decision so the format label, effort tag, and datetime don't crowd at ~620px width.

```
☑ ● LinkedIn · Carousel  MED ……………………………… [ 14/06/2026, 09:00 AM  📅 ]
   └ platform dot + label   └ effort tag        └ datetime-local (date + time)
```

**Open design questions:**
- Native `datetime-local` is functional but visually inconsistent across browsers. Do you want a custom
  date/time control to match Instrument, or is native acceptable for v1?
- At narrow widths the row may need to wrap (label on line 1, datetime on line 2). Define the responsive
  behaviour.
- Default time 09:00 — confirm, or should it derive from the user's typical posting time later?

---

## 4) Calendar card shows "Platform · Format" (D-58)

**What changed:** calendar cards showed only the idea title, so multiple pieces from one idea were
indistinguishable (a created Carousel looked identical to the hub). The card eyebrow now reads
**`PLATFORM · FORMAT`** (e.g. `LINKEDIN · CAROUSEL`).

```
WEEK CARD                       MONTH CELL (compact)
┌──────────────────────┐        ┌ 14 ──────────────┐
│ ● LINKEDIN · CAROUSEL │        │ ▎● dssd          │  ← month still shows title only
│ dssd                  │        │ ▎● dssd          │
│ 9:00 AM        ●●○    │        └──────────────────┘
│ [ Draft ]             │
└──────────────────────┘
```

**Open design questions:**
- Week card eyebrow now carries platform **and** format — confirm hierarchy (currently both in the same
  small uppercase eyebrow).
- **Month cell still shows the idea title only** (space-constrained, 96px cells). With multiple pieces
  per idea, month items can look duplicated. Decide: show format instead of/in addition to title in the
  month cell, or leave as a glance overview?

---

## Summary of screens to formalize

| Screen | Change | Priority |
|--------|--------|----------|
| New Idea (capture) | CTA copy + routes to Plan Week | low (copy only) |
| **Plan Week** | hub context row, datetime picker, empty/zero-new states | **high** (functional-first, no hi-fi yet) |
| Calendar week card | Platform · Format eyebrow | medium |
| Calendar month cell | (decision needed) format vs title | low |

The whole **Plan Week** screen was built beyond the original design package (it never had a hi-fi pass),
so it's the main candidate for your attention. Everything is live at `localhost:5173` — capture an idea
to land on it. Ping eng with the redlines and we'll match them.
