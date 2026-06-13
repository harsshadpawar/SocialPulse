# Design requirements — Plan Week (+ related v0.2i touchpoints)

**For:** UI/UX designer · **From:** product/eng · **Date:** 2026-06-13
**Ask:** produce **wireframes _and_ hi-fi designs** for the screens/states below. Plan Week was built
functional-first and has never had a design pass — it's the priority. This is the single brief; the
delta summary in `design-handoff-v0.2i.md` is now folded into this doc.

---

## 1. Product context (read first)

SocialPulse is a **personal content-execution cockpit** for one creator building a brand across
LinkedIn, X, YouTube, Instagram. It is **not** a content generator and **not** an auto-publisher — the
creator writes their own copy and posts manually; SocialPulse plans, reminds, and tracks adherence.

Guiding philosophy — **calm and non-punitive**: "do less, well." Reduce scope, never push harder.
Never use red/alarm; overload nudges say "consider removing one," not "you're behind."

**Hub-and-spoke model (core to this screen):** one *idea* (the hub) becomes a set of platform-ready
*pieces* (spokes) spread across the week. Plan Week is where that spread is decided.

## 2. Design system — stay inside "Instrument"

- Palette: warm paper background, ink text, single accent (teal). **Never red.** Status uses muted
  tones (dim/accent/late/success/missed) — already tokenised.
- Type: serif "command" headings; small **UPPERCASE tracked eyebrows**; humanist sans body.
- Generous whitespace, soft cards, 1px hairline dividers, subtle shadows.
- Tokens are the source of truth: `frontend/src/styles.css` (`@theme`). Please design against these
  tokens, not new hex values.
- Product invariants: **Asia/Dubai** timezone, **30-min grace** window, content column ≈ 620px on
  desktop. Mobile/responsive behaviour is currently undefined → **please define it.**

## 3. User & job-to-be-done

Solo creator, time-poor, prone to over-committing then missing. Job: *"I have one idea — help me turn
it into a realistic week of posts across my platforms, on the days and times I choose, without
overloading myself, and let me write the actual copy later."*

## 4. Flow & entry points

```
New Idea (capture)  ──"Next → plan the week"──►  PLAN WEEK  ──Create / Save as drafts──►  Calendar
                                                     │
                                          (hub draft also lives in Today → editor for copy)
```
Plan Week is reached right after capturing an idea (primary path) and from an idea's editor.

---

## 5. PLAN WEEK — requirements (priority screen)

### 5.1 Anatomy (current functional layout — redraw properly)

```
PLAN WEEK  (eyebrow)
Plan a week from “{idea title}”.            (serif command heading)
One idea → a set of platform-ready pieces. Pick platforms and how much — SocialPulse
proposes, you decide. Paste your own copy after.        (sub)

WHICH PLATFORMS?
[● LinkedIn] [● X] [● YouTube] [● Instagram]            (multi-select chips, platform dot)

HOW MUCH THIS WEEK?
[ Light | Medium | Heavy ]   segmented · default Light   ("Light keeps it realistic — one per platform")

PROPOSED — ACCEPT OR REMOVE                         Start [ 14/06/2026, 09:00  ▾ ]   ← date+time
┌──────────────────────────────────────────────────────────────────────────────┐
│ (locked) ● LinkedIn · Text post   [THIS IDEA]                   already created │
│ ☑ ● LinkedIn · Carousel  MED                            [ 14/06/2026, 09:00 ▾ ] │
│ ☑ ● LinkedIn · Video     HIGH                           [ 15/06/2026, 09:00 ▾ ] │
│ ☑ ● X · Post             LOW                            [ 16/06/2026, 09:00 ▾ ] │
└──────────────────────────────────────────────────────────────────────────────┘
        5 new pieces · 11 effort points · full load — heavy; consider removing one.
        [        Create 5 pieces        ]   [ Save as drafts ]
```

Each proposed row = checkbox (include/remove) · platform dot · **Platform · Format** · effort tag
(LOW/MED/HIGH) · **date + time picker**. The first row is the **hub** (the idea's own post): locked,
muted, "already created", not counted, not re-created.

### 5.2 Required states (please design every one)

1. **Hub only / no new pieces** (e.g. LinkedIn idea at Light): show hub row + calm hint *"No new pieces
   yet — add another platform, or bump the cadence to Medium or Heavy."* No action buttons.
2. **With spokes** (the main state, above).
3. **Overloaded** (effort > 6 → "full load"): the line turns to the calm-late tone and appends
   "— heavy; consider removing one." Never red. Design the emphasis.
4. **Save as drafts** path: pieces created with no date/time (undated). Needs a clear affordance/result.
5. **Creating / loading** and **error** states for the two buttons.
6. **Many rows** (Heavy × 4 platforms = up to 10 spokes + hub): list density, scroll, sticky footer?

### 5.3 Scheduling — date **and** time (critical; current bug to design out)

Requirement: every piece is scheduled with **date + time** (posting time matters). Today the controls
are native `datetime-local`, default 09:00.

**Known issue to solve in the redesign:** the **Start** field acts as a generator — changing it
**regenerates every row's datetime and wipes any per-row time the user set** ("I change a date and they
all reset to the same time"). Desired behaviour to design + spec:
- **Start = a starting template** that lays out an initial spread (by cadence-gap days, 09:00 default).
- **Per-row date/time edits must persist** and must **not** be overwritten when other rows, platforms,
  or cadence change. Define exactly when (if ever) a regen is allowed to touch a row the user has
  edited — recommend: never silently overwrite an edited row.
- Consider a clearer model than a single "Start": e.g. "Apply a default time to all", per-row only, or a
  small "reset spread" action. **Your call — propose the interaction.**
- Native pickers look inconsistent across browsers; decide whether to design a custom date+time control
  in the Instrument style or accept native for v1.

### 5.4 Interaction requirements

- Progressive disclosure: cadence appears after a platform is chosen; the proposal after that.
- Toggling a platform/cadence updates the proposed spokes **without** discarding user edits to rows that
  remain (see 5.3).
- Effort total + load updates live as rows are included/excluded; counts **new** pieces only (hub
  excluded).
- Editing a date/time must not steal focus or reorder rows.

---

## 6. Related touchpoints (smaller — wireframe + hi-fi)

**6.1 Capture entry (New Idea):** primary CTA is **"Next → plan the week"**, sub "…Planning the week
comes next." Two fields (Title, Core message). Question for you: do we also offer a secondary "just
write the post" path, or is Plan Week always next?

**6.2 Calendar week card:** card eyebrow now shows **PLATFORM · FORMAT** (e.g. "LINKEDIN · CAROUSEL")
above the idea title, then time + effort pips + status pill. Confirm the hierarchy of platform vs
format vs title.

**6.3 Calendar month cell (open decision):** compact 96px cells currently show the **idea title only**,
so multiple pieces of one idea look duplicated. Decide: show format, a count, or leave as glance-only.

---

## 7. Microcopy reference (keep the calm voice; edit freely)

- Heading: *Plan a week from "{idea}".*
- Sub: *One idea → a set of platform-ready pieces. Pick platforms and how much — SocialPulse proposes,
  you decide. Paste your own copy after.*
- Cadence hints: Light "one piece per platform" · Medium "two per platform" · Heavy "the full spoke."
- Hub row: `THIS IDEA` · "already created".
- Effort line: "{n} new pieces · {p} effort points · {light|moderate|full} load" (+ "— heavy; consider
  removing one." when full).
- Empty: "No new pieces yet — add another platform, or bump the cadence to Medium or Heavy."

## 8. Deliverables requested

1. **Wireframes** (lo-fi) for Plan Week — all states in §5.2, plus the scheduling interaction in §5.3.
2. **Hi-fi designs** for the same, in the Instrument system, against existing tokens.
3. **Responsive / mobile** layout for Plan Week (currently undefined).
4. Wireframe + hi-fi for the two calendar touchpoints (§6.2, §6.3) and the capture CTA (§6.1).
5. A short note on the **scheduling interaction model** you chose (§5.3) so eng can rebuild it.

## 9. Open design decisions (your calls — flagged inline above)

- Scheduling model: Start-as-template vs per-row vs "apply to all" (§5.3) — **most important.**
- Custom vs native date/time control (§5.3).
- Hub row treatment: in-list vs pinned-above caption (§5.1).
- Capture: always Plan Week vs offer "just write" (§6.1).
- Month cell: format vs title vs count (§6.3).

## 10. Out of scope

AI copy generation, auto-publishing, analytics dashboards (deliberately not part of the product spine).
Don't design these.

---

*Everything is live at `localhost:5173` — capture an idea to land on Plan Week and click through the
states. Decision history: `docs/decisions-v0.2i-plan-week-fixes.md` (D-53…D-59).*
