# Selector Spec — SocialPulse v0.1

> The selector is the executable representation of the product promise:
> "interpret the day for the creator."
> It may evolve; it must remain pure. Time is injected, forever.
>
> `selectTodayPost(posts: DomainPost[], now: Instant, tz: 'Asia/Dubai') → DomainPost | null`
> No DB calls. No `new Date()`. No config reads. No mutation. (Decisions #25, #26, #29)
> **Stability rule:** selector output ordering must be deterministic. No randomization,
> no time reads, no hidden state. Same `(posts, now, tz)` → same result, every call.

---

## 1. State definitions (derived — ADR-2)

**posting_status** = f(target_datetime, actual_datetime, grace, now)

| Rule (first match wins) | Status |
|---|---|
| `actual_datetime != null` | **Posted** |
| `target_datetime == null` | **Planned** (unscheduled draft) |
| `now < target` | **Planned** |
| `target ≤ now ≤ target + grace` | **Due** |
| `now > target + grace` | **Missed** |

**adherence_status** = f(target, actual, grace, now)

| Rule | Adherence |
|---|---|
| `actual == null` and status != Missed | **Not Applicable** |
| `actual == null` and status == Missed | **Missed** |
| `actual ≤ target + grace` (incl. early: `actual < target`) | **On-time** |
| `actual > target + grace` | **Late** |

Invariant: `actual` can only exist when `target` exists (Mark Posted requires Ready; Ready requires target).
**Invariant (frozen): `target_datetime` is immutable once a post becomes Due** — enforced in the
service layer, never only in the UI. This is the rule protecting adherence integrity (decision #10).
Grace = `grace_window_minutes` (default 30), read per post. Boundary is **inclusive**: exactly +30:00 is On-time/Due.

**Card state key** (drives command line, chips, CTA, microcopy):

| Condition | Card state |
|---|---|
| `actual != null` | `posted` |
| status == Missed | `missed` |
| readiness == draft | `draft` |
| readiness == ready, status == Planned | `planned_ready` |
| readiness == ready, status == Due | `due` |

Note: a Draft past its target derives Due/Missed by time, but renders as `draft`/`missed`;
the due-but-not-ready prompt is v0.2. CTA for any draft = "Continue editing".

---

## 2. Day scope

"Today" = the Dubai calendar day containing `now` (`APP_TIMEZONE`, UTC+4, no DST).

- Posts targeted on a **future** Dubai day: excluded (invisible until their day).
- **Untargeted drafts: always eligible** (no list view exists; they must not be lost).
- **Unacknowledged Missed: always eligible regardless of age** (else "Keep as Missed" is pointless).
- Posted posts: eligible only if `actual_datetime` falls on today (Dubai). Yesterday's posted → gone.
- Acknowledged Missed (`missed_acknowledged_at != null`): never selected.

---

## 3. Priority order (declared data, not nested ifs)

1. **Due** — earliest `target_datetime` first
2. **Missed, unacknowledged** — earliest target first
3. **Ready + Planned, targeted today** — earliest target first
4. **Draft** — targeted today (earliest first), then untargeted (newest `created_at` first)
5. **Posted today** — latest `actual_datetime` first
6. — none → `null` → empty state ("Today is clear…")

Tie-break within a class: earliest target; if equal or both null, newest `created_at`. Fully deterministic.

**Why Due outranks Missed** (deviation from delivery-review golden table, deliberate):
a Due post is the only time-critical item — its grace window is burning, and surfacing a
yesterday-Missed above it would *cause* a second miss while the user files the first one.
Missed is already missed; resolving it has no deadline. Due first prevents losses;
Missed first only files them. (Consistent with frozen decision #5.)

---

## 4. Capabilities (derived; server-returned — decisions #15, #22)

| Capability | Rule |
|---|---|
| `canEditPrepare` (platform/format/caption) | `actual == null` |
| `canEditTarget` | `actual == null` AND status is Planned (incl. no target) — locked from Due onward (#10) |
| `canMarkReady` | `readiness == draft` (invoke runs the gentle gate: caption, platform, format, target) |
| `canMarkPosted` | `readiness == ready` AND `actual == null` (works from Planned #4, Due, Missed) |
| `canAcknowledgeMissed` | status == Missed AND `actual == null` AND not yet acknowledged |
| `canEditActual` | `actual != null` (edits recompute adherence — derived, always) |
| `canSetUrl` | `actual != null` (URL field does not exist before Posted) |

Edge: a Missed **draft** has `canMarkPosted = false` — user must Mark Ready first (gate may pass with
old target; target itself is locked). Accepted v0.1 friction; noted for v0.2.

---

## 5. Golden test table (write these tests before the implementation)

Derivation — `now` injected, grace 30 unless noted:

| # | Scenario | Expected |
|---|---|---|
| D1 | target null | Planned, N/A |
| D2 | now < target | Planned, N/A |
| D3 | now == target | Due |
| D4 | now == target + 30:00 | Due (inclusive) |
| D5 | now == target + 30:01 | Missed, adherence Missed |
| D6 | actual == target + 30:00 | On-time (boundary) |
| D7 | actual == target + 30:01 | Late |
| D8 | target 23:55, actual 00:10 next day | On-time (15 min) |
| D9 | target 23:50, now 00:15 next day | Due (grace crosses midnight) |
| D10 | target 23:50, now 00:21 next day | Missed |
| D11 | actual < target (early post, #4) | On-time |
| D12 | Missed, then posted with actual = now (past grace) | Late |
| D13 | Missed→Posted, actual edited into grace window (#9) | On-time (derived rule wins) |

Selector — `posts[]` + `now` injected:

| # | Scenario | Expected |
|---|---|---|
| S1 | no posts | null (empty state) |
| S2 | one untargeted draft | that draft |
| S3 | ready, target later today | planned_ready card |
| S4 | due now | due card |
| S5 | missed, unacknowledged | missed card |
| S6 | missed, acknowledged, nothing else | null |
| S7 | yesterday missed (unack) + today due | **due wins** (see §3) |
| S8 | two due | earliest target |
| S9 | draft today + ready today | ready (class 3 > class 4) |
| S10 | posted today + draft targeted tomorrow | posted (future-day excluded) |
| S11 | posted yesterday only | null |
| S12 | ready targeted tomorrow | null (day scope) |
| S13 | same inputs called twice | identical result (determinism) |
| S14 | missed acknowledged + untargeted draft | draft |

---

*Spec is authority for `domain/selector.ts`, `postingStatus.ts`, `adherence.ts`. If code and
spec disagree, fix one — deliberately.*
