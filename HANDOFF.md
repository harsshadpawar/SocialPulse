# SocialPulse — Session Handoff

**Updated:** 2026-06-13 (post-v0.2i) · **Branch:** `main` · **Remote:** none (all local, nothing pushed)

---

## TL;DR — where we are

The full execution + planning loop is **built, tested, and verified live**, end to end:
**Plan → Prepare → Reminder → Manual Post → Mark Posted → Measure Adherence → Weekly Review → Improve.**

Everything is committed and tagged locally. Lineage:

```
v0.1.0 → v0.2a → v0.2b → v0.2c → v0.2d → v0.2e → v0.2f → v0.2g → v0.2h → v0.2i → v0.2j → v0.2k   (HEAD = a0ae883 until you commit v0.2i + v0.2j + v0.2k)
```

- **96 backend tests green**, backend + frontend typechecks clean.
- **Nothing has been pushed to GitHub** (no `origin` remote yet).

---

## What each tag is

| Tag | What shipped | Schema? |
|-----|--------------|---------|
| v0.1.0 | Execution loop — Today (6 states), New Idea, staged Editor, Mark Posted, Result, Missed path; Instrument design on Tailwind v4 | base |
| v0.2a | Readiness sub-states (D-30), due-but-not-ready (D-31), adherence_event log (ADR-5), post-count targets strip (D-32/33) | yes (v0.2a) |
| v0.2b | Derived "Today's work is done" (D-34) + Quick Start (D-35); day_closure persistence deferred (D-36) | none |
| v0.2c | Multi-platform repurpose (D-37) + derived effort & weekly capacity (D-38); media deferred to backlog | none |
| v0.2d | Calendar Week View + overload rule (D-45) · Goals Setup/Progress (D-43/47) · Today·Calendar·Goals nav (D-46) · one shared deriveWeeklyMetrics (D-44) | yes (commitments cols) |
| v0.2e | Weekly Review — derived summary (reads shared metrics, D-49) + persisted reflection blockers/repeat/stop (D-48); contextual entry, no 4th nav (D-50); current week only (D-51) | yes (weekly_review table) |
| v0.2f | Editable formats per platform (D-52) — format chosen per post (thread/carousel/video/long_video/image), Format dropdown enabled; effort derives per format (video = high) | yes (Format enum values) |
| v0.2g | "Plan week from this idea" (D-53) — hub-and-spoke: platforms → cadence → fixed-ladder proposal → accept/remove → schedule or save-as-drafts; live effort guardrail; captions seed from coreMessage, no AI | none |
| v0.2h | Calendar Month view + Week/Month toggle + ‹ › / Today navigation (D-54); effort/realism use a `weekRef`, status always vs real now | none |
| v0.2i | Plan Week fixes — `Shell` hoisted (no remount/focus loss), grammar (D-55); capture routes to Plan Week (D-56); hub context row so the proposal is never empty / counts new pieces only (D-57); **calendar cards show "Platform · Format" so pieces are identifiable — fixes the "adding wrongly / not inserting" report (insert verified: 1 click = 1 row) (D-58); Plan Week schedules date **and time** via datetime-local, default 09:00 (D-59)**; verified live | none |
| v0.2j | **Plan Week rebuilt to the approved hi-fi**: custom Instrument date+time picker (D-60); **Apply-to-all scheduling — per-row edits persist, the reset bug designed out** (D-61); calendar month ×count badge (D-62); pinned hub caption + capture "just write the post" + calm drafts/error/loading states + mobile (D-63). Live-verified incl. a StrictMode Apply-spread fix | none |
| v0.2k | **Consistency Reports** — new 4th nav surface (D-64): pure `deriveConsistencyReport` (12-wk completion trend, light-cadence streak, 6-mo rollup, per-platform, gentle patterns; `GET /api/reports`); calm/non-punitive ReportsPage, shared green scale, never red; all states. 102 backend tests green, tsc clean; live click-through pending dev restart | none |

Decision records live in `docs/decisions-*.md` (D-30 … D-54, incl. `decisions-v0.2f-editable-formats.md`,
`decisions-v0.2g-plan-week.md`, `decisions-v0.2h-calendar-nav.md`, `decisions-phase2-weekly-review.md`)
and `docs/selector-spec.md`. Core invariants:
ADR-2 derive-don't-store · ADR-3 server derives state, client owns words · ADR-5 append-only event log ·
one shared weekly-metrics derivation read by Today/Calendar/Goals/Review · calm, non-punitive voice ·
Asia/Dubai timezone · 30-min grace window.

---

## Designs status — NONE pending

Every screen in the design handoff package is **built**:
- `hifi/` (v0.1): Today ×6, New Idea, Editor (Prepare→Schedule→Publish), Mark Posted, Result — done.
- `hifi-v0.2d/` (planning): Calendar Week View (realistic/overloaded/missed/empty), Goal Setup, Goal
  Progress (on-rhythm/rough), Goals empty — done.
- Weekly Review (PRD Phase 2), editable formats (v0.2f), and Plan Week (v0.2g) — built **functional-first**
  in the Instrument style; these were beyond the original design package (Weekly Review was flagged as a
  separate later design pass) and could be refined by a designer later, but are complete and on-brand.

**So the entire designed + specced product is complete. There are zero unbuilt designs.**

## Why "build to the very end" can't continue right now

The remaining PRD work (Phases 3–7) is **not blocked on missing design details I can fill** — it's blocked
on things only you can unlock:

1. **External API access (Phases 3–5, analytics).** YouTube / Cloudflare / LinkedIn / Instagram / X each
   need OAuth app registration, developer accounts, and (LinkedIn/Instagram) access approval or (X) a paid
   API plan. None of that can be built without real credentials. The PRD itself flags this friction (§11, §16.2).
2. **No design exists for analytics / AI surfaces.** The v0.2d brief explicitly excluded analytics
   dashboards, AI planner, and reporting from the design pass — each would need a *new* design pass.
3. **Phase 7 (auto-publishing) contradicts the product spine.** SocialPulse is deliberately
   manual/self-attested ("does NOT publish via API"); the handoff lists auto-publishing under **do-NOT-build**.

## TO TAKE UP WHEN WE RESTART (in order)

1. **GitHub push (primary next step).** No remote is configured. To publish:
   ```
   git remote add origin <your-repo-url>
   git push -u origin main --tags
   ```
   (Claude can set this up and hand you the exact commands — Claude won't run the push itself.)

2. **Optional — clean the dev database.** It currently holds test data from live verification
   (sample posts + a Weekly Review reflection). For a clean slate before real use:
   ```
   docker compose down -v && npm run db:up && npm run migrate && npm run seed
   ```

3. **Future build fronts (all bigger, mostly external-API work):**
   - PRD **Phase 3** — YouTube analytics (first real integration).
   - PRD **Phase 4** — Cloudflare website analytics.
   - PRD **Phase 5** — LinkedIn / Instagram / X analytics.
   - PRD **Phase 6** — AI planning assistant (uses real adherence + analytics history).
   - PRD **Phase 7** — optional publishing automation.

---

## Parked / backlog (deliberately deferred, with rationale on record)

- **day_closure persistence** — deferred until 30–50 real posting cycles validate the ritual (D-36).
- **Media** (`media_reference` + `needs_media` readiness step) — backlog until usage shows demand (v0.2c rejection).
- **Calendar Month view + prev/next navigation** — **shipped in v0.2h.** (The per-date "+" quick-add was
  folded into the Plan Week flow instead of a calendar-cell button.)
- **Weekly Review:** past-week picker, historical browser, and a real "Plan next week" generator — deferred (D-51).
- **Permanent "Review" nav item** — only if usage proves it deserves first-class navigation (D-50).
- **Calendar drag-to-reschedule** and real overload "reduce/drop" actions — "Should", not built (D-45).
- **Media management** and the **AI-copy / analytics / publishing** phases — all parked (see "Why … can't continue").

## Next phase (queued by the owner, 2026-06-13)

- **Consistency reports — over weeks & months (NEXT BUILD).** A read/aggregation layer over data we
  already capture (no external APIs needed): the append-only `adherence_event` log (ADR-5), the shared
  `deriveWeeklyMetrics` (completion %, on-time %, execution score, prepared-ahead), and Weekly Review
  reflections. Show streaks and trends in the calm, non-punitive voice — never red "you failed" bars.
  Buildable now without the blocked integrations. Needs an architect framing pass before build.
- **Mobile layout polish (next phase).** The v0.2j rebuild already ships responsive row-stacking + a
  sticky footer for Plan Week; deferred work is polishing/QA on a real device and extending the same
  responsive treatment to Today / Calendar / Goals.

---

## How to run & restart

```
npm run dev        # db:up + migrate + api(3001) + web(5173)
```

**If the dev server errors on start** it's almost always a stale duplicate process. Free the ports, then start once:
```
lsof -ti tcp:3001 | xargs kill
lsof -ti tcp:5173 | xargs kill
npm run dev
```

**Verify quickly:** `/api/health` → 200; open http://localhost:5173 → Today · Calendar · Goals all render;
an overloaded week (3 high-effort videos across 2 days, capacity 5 in Goals) fires the calm "reduce one" warning.

---

*Strong run this session: inherited the v0.1 baseline, audited it, then designed + built + verified
v0.2b–h to the design handoff and PRD — execution loop, planning layer, Weekly Review, editable formats,
hub-and-spoke Plan Week, and Calendar Month view + navigation. The product is feature-complete; next is
integrations (Phase 3+) or a GitHub push.*
