# v0.2i — Plan Week interaction fixes · frozen decisions (2026-06-13)

Bug-fix patch on top of v0.2g's "Plan week from this idea". No schema change, no behavioural
contract change — three correctness/UX fixes uncovered by live testing ("below options not working
fully"). Frontend only (`frontend/src/pages/PlanWeekPage.tsx`).

## D-55 · Three Plan-Week fixes

1. **Empty-proposal looked broken.** Selecting only the hub's own platform at Light produced an empty
   list (the hub's own piece is correctly excluded), so the page rendered *nothing* below the cadence
   toggle and read as a dead control. Now an explicit guidance line appears:
   *"Nothing new to add yet — your idea is already a {format} on {platform}. Add another platform, or
   bump the cadence to Medium or Heavy for more pieces."* The flow now always shows either pieces or a
   reason there are none.

2. **`Shell` was defined inside the component.** It was re-created on every render, remounting the
   whole subtree and dropping input focus while editing dates. Moved to module scope so children are
   stable across renders.

3. **Grammar.** "1 effort points" / "1 pieces" → singular/plural now agree
   ("1 piece · 1 effort point · light load").

## D-59 · Plan Week schedules date **and time**

Proposed pieces (and the Start field) were date-only and the create silently hardcoded 09:00 — wrong,
since posting time is a critical field. Both inputs are now `datetime-local` (`YYYY-MM-DDTHH:mm`),
defaulting to **09:00** but fully editable per piece. `proposeDateStr` carries the time of day while
spreading by cadence-gap days; create now sends the chosen local datetime as ISO (drafts/cleared = null).
Verified live: a piece set to 14:30 Dubai persisted as `10:30Z` (UTC+4). No schema change — the column
was already a timestamp.

## D-58 · Calendar cards show platform · format

**Problem (reported as "adding wrongly / not actual db insert"):** a calendar card showed only the
idea title (e.g. "dssd"), so pieces from the same idea were indistinguishable. After Plan Week, the
visible card looked like the hub ("the default one") and the created piece seemed missing — even
though it had persisted. This drove **re-clicking Create**, producing a genuine duplicate (two
identical LinkedIn · Carousel rows for one idea; effort honestly read 4 pts).

**Verified against the live DB, not the screenshots:**
- The persisted Jun-14 card had `effortScore: medium` + target 09:00 Dubai → it was the **Carousel**,
  not the text hub. Insert works.
- A controlled single backend call `POST …/plan-week` with one piece returned `created: 1` and added
  exactly **one** row → no double-insert bug; the duplicate came from a second user click.

**Fix:** `format` is now included on `CalPostView` and `CompactPost` (calendar service + frontend
types), and the week card's eyebrow reads **"{Platform} · {Format}"** (e.g. "LINKEDIN · CAROUSEL").
Pieces are now identifiable, and a created piece is visibly distinct from the hub. No schema change.

**Not changed (by design):** multiple posts per platform per idea remain allowed (D-37, repurpose), so
no hard dedupe guard was added. The create flow already navigates away on success and disables while
pending, so a single visit can't double-submit; the duplicate required a deliberate second visit+click.
A future "you already planned this" guard is parked pending architect sign-off.

## D-57 · Hub context row — the proposal is never empty

**Problem (reported twice as "clicks not working"):** landing from capture on a LinkedIn idea defaults
to LinkedIn + Light. The hub's own piece (LinkedIn text_post) is the only Light proposal and is
excluded, so the list rendered empty. Toggling Light / the hub platform changed nothing visible →
read as dead clicks. Diagnosis confirmed there was **no actual click bug** (DOM probing: no overlay,
`pointer-events: auto`, every button topmost at its center; state updates on every toggle — the
earlier "nothing happens" reads were a synchronous-DOM-read measurement artifact).

**Fix:** the hub now renders as a **locked context row** at the top of the proposal — *"{platform} ·
{format} · THIS IDEA · already created"* (disabled checked checkbox, muted, not removable, **not**
re-created). The proposal section shows whenever a platform is selected (`showHub || pieces.length`),
so the list is never empty. The effort guardrail counts **new** pieces only ("5 new pieces · …"); when
there are no new pieces it shows a calm hint instead of a "0 pieces" line and hides the action buttons.

Verified live: LinkedIn + Light → hub row + "No new pieces yet — add another platform…"; adding X +
Heavy → hub row + 5 new spokes, "5 new pieces · 11 effort points · full load", "Create 5 pieces".

## D-56 · Capture routes to Plan Week (not the editor)

New Idea capture now navigates to `/posts/:id/plan-week` instead of `/posts/:id` after creating the
idea + hub draft. CTA copy changed to **"Next → plan the week"** and the sub to *"…Planning the week
comes next."* Rationale: the hub-and-spoke model wants you to decide the *spread* before writing any
single piece. The hub's own LinkedIn draft is unchanged — it still needs its caption, written later
from Today → editor (one hop, nothing lost). Frontend only (`NewIdeaPage.tsx`, `microcopy.ts`).
Verified live: capturing a LinkedIn idea lands on Plan Week with LinkedIn+Light → the D-55 guidance
line shows (no blank screen).

## Verified live (Chrome)
- Hub-only + Light → guidance message (no dead control).
- LinkedIn+X+YouTube+Instagram + Heavy → exactly 10 pieces, 21 pts, full-load guardrail
  ("…heavy; consider removing one") with the correct ladder.
- Unchecking pieces → total/points recompute, button relabels ("Create N pieces"), struck-through rows.
- Deselecting platforms back to X-only + Light → rebuilds to "1 piece · 1 effort point · light load".
- **Save as drafts** → creates and navigates to the calendar.

Frontend typecheck clean. No backend change, so the 96 backend tests are unaffected.

## Known minor (not fixed here, parked)
Saving **dateless drafts** then landing on the dated **calendar** means those drafts aren't visible on
a specific day (drafts have no target date by design — they live in Today / the idea). Considered
expected for now; revisit only if it confuses real use (could route Save-as-drafts → Today instead of
Calendar).
