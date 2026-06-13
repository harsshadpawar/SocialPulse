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
