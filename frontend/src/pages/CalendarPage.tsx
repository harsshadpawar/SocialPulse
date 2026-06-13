// v0.2d Calendar Week View — ported from hifi-v0.2d/hifi-calendar.jsx onto the live data.
// Renders server-derived realism (ADR-3); the client owns the calm words. Never red.
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchCalendar } from '../api/client';
import type { CalPostView, EffortScore, WeekState } from '../api/types';
import { NavHeader } from '../components/NavHeader';
import { BtnGhost, BtnPrimary, BtnSecondary, Eyebrow, StatusPill } from '../components/ui';
import type { Tone } from '../components/ui';
import {
  CAL_EMPTY_BODY,
  CAL_MISSED_BODY,
  CAL_MISSED_LABEL,
  CAL_MISSED_RESOLVE,
  REALISM_ADJUST,
  REALISM_KEEP,
  REALISM_LABEL,
  calCommand,
  calEyebrow,
  calMissedHeading,
  realismBody,
  realismFix,
} from '../lib/microcopy';
import { PLATFORM_META } from '../lib/platform';

const PIP_GREEN: Record<number, string> = { 1: 'oklch(72% 0.09 155)', 2: 'oklch(58% 0.1 155)', 3: 'oklch(46% 0.11 155)' };
const EFFORT_N: Record<EffortScore, number> = { low: 1, medium: 2, high: 3 };
const TIME_FMT = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Dubai' });
const DOW_NAME = new Intl.DateTimeFormat('en-US', { weekday: 'long', timeZone: 'UTC' });

function dayName(dayKey: string | null): string | null {
  if (!dayKey) return null;
  const p = dayKey.split('-').map(Number);
  return DOW_NAME.format(new Date(Date.UTC(p[0]!, p[1]! - 1, p[2]!, 12)));
}

function EffortPips({ n }: { n: number }) {
  return (
    <span className="inline-flex items-center gap-1" title={`effort ${n}`}>
      {[1, 2, 3].map((i) => (
        <span
          key={i}
          className={`size-1.5 rounded-full ${i <= n ? '' : 'bg-ink/15'}`}
          style={i <= n ? { backgroundColor: PIP_GREEN[i] } : undefined}
        />
      ))}
    </span>
  );
}

function CapacityMeter({ used, cap }: { used: number; cap: number | null }) {
  const legend = (
    <div className="mt-3 flex items-center gap-4 text-[12px] text-dim">
      <span className="flex items-center gap-1.5">
        <EffortPips n={1} /> low
      </span>
      <span className="flex items-center gap-1.5">
        <EffortPips n={2} /> med
      </span>
      <span className="flex items-center gap-1.5">
        <EffortPips n={3} /> high
      </span>
    </div>
  );
  if (cap === null) {
    return (
      <div className="rounded-xl border border-ink/12 bg-white px-6 py-4 shadow-[0_1px_2px_rgba(40,35,25,0.05)]">
        <div className="flex items-center gap-5">
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-dim">Weekly effort</span>
          <span className="flex-1 text-[13px] text-dim">Set a weekly capacity in Goals to flag heavy weeks.</span>
          <span className="whitespace-nowrap text-[14px] font-semibold tabular-nums text-ink">{used} pts</span>
        </div>
        {legend}
      </div>
    );
  }
  const over = Math.max(0, used - cap);
  return (
    <div className="rounded-xl border border-ink/12 bg-white px-6 py-4 shadow-[0_1px_2px_rgba(40,35,25,0.05)]">
      <div className="flex items-center gap-5">
        <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-dim">Weekly effort</span>
        <div className="flex flex-1 items-center gap-1.5">
          {Array.from({ length: cap }).map((_, i) => {
            const filled = i < used;
            const L = 76 - (cap > 1 ? i / (cap - 1) : 0) * 30; // light → dark green as the week fills
            return (
              <span
                key={i}
                className={`h-2.5 max-w-[44px] flex-1 rounded-full ${filled ? '' : 'bg-success/15'}`}
                style={filled ? { backgroundColor: `oklch(${L}% 0.1 155)` } : undefined}
              />
            );
          })}
          {over > 0 && <span className="mx-1 h-4 w-px bg-ink/25" />}
          {Array.from({ length: over }).map((_, i) => (
            <span key={`o${i}`} className="h-2.5 max-w-[44px] flex-1 rounded-full bg-late/55" />
          ))}
        </div>
        <span className={`whitespace-nowrap text-[14px] font-semibold tabular-nums ${used > cap ? 'text-late' : 'text-ink'}`}>
          {used} of {cap} pts
        </span>
      </div>
      {legend}
    </div>
  );
}

function postLabel(p: CalPostView): [Tone, string] {
  if (p.postingStatus === 'posted') return p.adherenceStatus === 'late' ? ['late', 'Late'] : ['success', 'Posted'];
  if (p.postingStatus === 'missed') return ['missed', 'Missed'];
  if (p.postingStatus === 'due') return ['accent', 'Due'];
  return p.readiness === 'ready' ? ['accent', 'Ready'] : ['dim', 'Draft'];
}

function CalPost({ post, onOpen }: { post: CalPostView; onOpen: () => void }) {
  const meta = PLATFORM_META[post.platform];
  const [tone, label] = postLabel(post);
  return (
    <button
      type="button"
      onClick={onOpen}
      className={`flex flex-col gap-1.5 rounded-lg border p-2.5 text-left transition hover:border-ink/25 ${
        post.missed ? 'border-dashed border-missed/40 bg-missed/5' : 'border-ink/12 bg-white'
      }`}
    >
      <span className="inline-flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-dim">
        <span className="size-[6px] rounded-full" style={{ backgroundColor: meta.color }} />
        {meta.label}
      </span>
      <p className="text-[12.5px] font-medium leading-snug">{post.ideaTitle}</p>
      <div className="flex items-center justify-between pt-0.5">
        <span className="whitespace-nowrap text-[11px] tabular-nums text-dim">{TIME_FMT.format(new Date(post.targetDatetime))}</span>
        <EffortPips n={EFFORT_N[post.effortScore]} />
      </div>
      <div>
        <StatusPill tone={tone}>
          <span className="text-[11px]">{label}</span>
        </StatusPill>
      </div>
    </button>
  );
}

export function CalendarPage() {
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState(false);
  const { data, isPending, isError } = useQuery({
    queryKey: ['calendar'],
    queryFn: fetchCalendar,
    refetchOnWindowFocus: true,
  });

  const state: WeekState = data?.realism.state ?? 'empty';
  const [tone, label] = calEyebrow(state);
  const heavyDay = dayName(data?.realism.heavyDayKey ?? null);
  const firstHigh = data?.days.flatMap((d) => d.posts).find((p) => p.effortScore === 'high');
  const firstMissed = data?.days.flatMap((d) => d.posts).find((p) => p.missed);

  return (
    <div className="flex min-h-screen flex-col bg-paper font-sans text-ink antialiased">
      <NavHeader active="calendar" right={data ? data.label : ''} />
      <main className="mx-auto w-full max-w-[1280px] flex-1 px-10 pt-10 pb-10">
        {isPending && <p className="text-[15px] text-dim">…</p>}
        {isError && <p className="text-[15px] text-dim">Can't reach the API — is `npm run dev` running?</p>}

        {data && (
          <>
            <Eyebrow tone={tone} pulse={state === 'overload'}>
              {label}
            </Eyebrow>
            <h1 className="mt-2.5 font-serif text-[30px] leading-[1.18]">{calCommand(state)}</h1>

            <div className="mt-7">
              <CapacityMeter used={data.effort.used} cap={data.effort.capacity} />
            </div>

            {state === 'empty' ? (
              <div className="mt-6 rounded-xl border border-ink/12 bg-white">
                <div className="flex flex-col items-center gap-4 px-8 py-16 text-center">
                  <span className="flex size-11 items-center justify-center rounded-full border border-ink/12 text-[18px] text-dim">＋</span>
                  <p className="max-w-[44ch] text-[15px] leading-relaxed text-dim">{CAL_EMPTY_BODY}</p>
                  <BtnPrimary className="mt-1 px-8" to="/ideas/new">
                    Create idea
                  </BtnPrimary>
                </div>
              </div>
            ) : (
              <div className="mt-6 grid grid-cols-7 gap-2.5">
                {data.days.map((d) => (
                  <div
                    key={d.dayKey}
                    className={`flex flex-col gap-2 rounded-xl border p-2 ${d.isToday ? 'border-accent/30 bg-accent/[0.03]' : 'border-ink/8'}`}
                  >
                    <div className="flex items-baseline gap-1.5 px-1 pt-0.5">
                      <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-dim">{d.dow}</span>
                      <span className={`text-[14px] font-semibold tabular-nums ${d.isToday ? 'text-accent' : ''}`}>{d.dayNum}</span>
                      {d.isToday && <span className="ml-auto size-1.5 rounded-full bg-accent" />}
                    </div>
                    <div className="flex min-h-[150px] flex-col gap-2">
                      {d.posts.map((p) => (
                        <CalPost key={p.id} post={p} onOpen={() => navigate(`/posts/${p.id}`)} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {state === 'overload' && !dismissed && (
              <div className="mt-6 rounded-xl border border-accent/30 bg-accent/[0.05] p-6">
                <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-accent">{REALISM_LABEL}</p>
                <h3 className="mt-1.5 font-serif text-[21px]">This week may be heavy.</h3>
                <p className="mt-2 max-w-[70ch] text-[14.5px] leading-relaxed text-ink/85">
                  {realismBody(heavyDay, data.realism.totalEffort, data.realism.capacity)}
                </p>
                <p className="mt-2 max-w-[70ch] text-[14.5px] font-medium leading-relaxed">{realismFix(heavyDay)}</p>
                <div className="mt-5 flex gap-3">
                  {firstHigh && (
                    <BtnPrimary className="px-5" onClick={() => navigate(`/posts/${firstHigh.id}`)}>
                      {REALISM_ADJUST}
                    </BtnPrimary>
                  )}
                  <BtnGhost className="px-4" onClick={() => setDismissed(true)}>
                    {REALISM_KEEP}
                  </BtnGhost>
                </div>
              </div>
            )}

            {state === 'missed' && firstMissed && (
              <div className="mt-6 rounded-xl border border-missed/25 bg-missed/[0.05] p-6">
                <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-missed">{CAL_MISSED_LABEL}</p>
                <h3 className="mt-1.5 font-serif text-[21px]">{calMissedHeading(dayName(firstMissed.targetDatetime.slice(0, 10)))}</h3>
                <p className="mt-2 max-w-[70ch] text-[14.5px] leading-relaxed text-ink/85">{CAL_MISSED_BODY}</p>
                <div className="mt-5 flex gap-3">
                  <BtnPrimary className="px-5" onClick={() => navigate(`/posts/${firstMissed.id}`)}>
                    {CAL_MISSED_RESOLVE}
                  </BtnPrimary>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
