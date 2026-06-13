// v0.2d Goals — ported from hifi-v0.2d/hifi-goals.jsx. Controllable commitments + derived progress
// reading the shared metrics (ADR-3). Non-punitive everywhere (D-47).
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchGoals, saveCommitments } from '../api/client';
import type { Commitments, GoalVerdict } from '../api/types';
import { NavHeader } from '../components/NavHeader';
import { BtnPrimary, BtnSecondary, Command, Eyebrow, ICard, StatusPill } from '../components/ui';
import {
  GOALS_BANNED,
  GOALS_BANNED_LABEL,
  GOALS_EDIT,
  GOALS_EMPTY_BODY,
  GOALS_EMPTY_COMMAND,
  GOALS_EMPTY_CTA,
  GOALS_EMPTY_EYEBROW,
  GOALS_PROGRESS_TITLE,
  GOALS_SAVE,
  GOALS_SETUP_COMMAND,
  GOALS_SETUP_EYEBROW,
  GOALS_SETUP_SUB,
  REVIEW_THIS_WEEK,
  goalVerdictLine,
  goalVerdictPill,
} from '../lib/microcopy';

const GREEN_GRAD = 'linear-gradient(90deg, oklch(76% 0.08 155), oklch(48% 0.1 155))';

function Stepper({
  label,
  helper,
  value,
  unit,
  min,
  max,
  step = 1,
  onChange,
}: {
  label: string;
  helper?: string;
  value: number;
  unit?: string;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
}) {
  const clamp = (v: number) => Math.max(min, Math.min(max, v));
  return (
    <div className="flex items-center justify-between gap-6 border-b border-ink/8 py-4 last:border-0">
      <div>
        <p className="whitespace-nowrap text-[15px] font-medium">{label}</p>
        {helper && <p className="mt-0.5 text-[13px] text-dim">{helper}</p>}
      </div>
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          className="flex size-8 items-center justify-center rounded-lg border border-ink/15 text-[17px] text-ink hover:bg-ink/5"
          onClick={() => onChange(clamp(value - step))}
        >
          −
        </button>
        <span className="w-16 text-center text-[16px] font-semibold tabular-nums">
          {value}
          {unit && <span className="ml-1 text-[12px] font-normal text-dim">{unit}</span>}
        </span>
        <button
          type="button"
          className="flex size-8 items-center justify-center rounded-lg border border-ink/15 text-[17px] text-ink hover:bg-ink/5"
          onClick={() => onChange(clamp(value + step))}
        >
          +
        </button>
      </div>
    </div>
  );
}

function GoalMeter({
  label,
  value,
  total,
  note,
  tone,
}: {
  label: string;
  value: number;
  total: number;
  note?: string;
  tone?: 'late' | 'missed';
}) {
  const pct = total > 0 ? Math.min(100, Math.round((value / total) * 100)) : 0;
  const solid = tone === 'missed' ? 'bg-missed/70' : tone === 'late' ? 'bg-late/70' : '';
  return (
    <div className="py-2.5">
      <div className="flex items-center justify-between text-[14px]">
        <span className="font-medium">{label}</span>
        <span className="whitespace-nowrap tabular-nums text-dim">
          {value} of {total}
        </span>
      </div>
      <div className={`mt-2 h-2.5 overflow-hidden rounded-full ${tone ? 'bg-ink/10' : 'bg-success/15'}`}>
        <div className={`h-full rounded-full ${solid}`} style={{ width: `${pct}%`, ...(solid ? {} : { background: GREEN_GRAD }) }} />
      </div>
      {note && <p className="mt-1.5 text-[12.5px] text-dim">{note}</p>}
    </div>
  );
}

const DEFAULTS = { publish: 5, prepare: 3, completion: 80, missed: 2, capacity: 5 };

function Shell({ active = 'goals', children }: { active?: 'goals'; children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-paper font-sans text-ink antialiased">
      <NavHeader active={active} right="Goals" />
      {children}
    </div>
  );
}

export function GoalsPage() {
  const queryClient = useQueryClient();
  const { data, isPending, isError } = useQuery({ queryKey: ['goals'], queryFn: fetchGoals, refetchOnWindowFocus: true });
  const [editing, setEditing] = useState(false);

  // Setup form state, seeded from saved commitments (or sensible defaults).
  const [publish, setPublish] = useState(DEFAULTS.publish);
  const [prepare, setPrepare] = useState(DEFAULTS.prepare);
  const [completion, setCompletion] = useState(DEFAULTS.completion);
  const [missed, setMissed] = useState(DEFAULTS.missed);
  const [capacity, setCapacity] = useState(DEFAULTS.capacity);

  useEffect(() => {
    if (!data) return;
    const c = data.commitments;
    setPublish(c.weeklyPublishTarget ?? DEFAULTS.publish);
    setPrepare(c.prepareAheadTarget ?? DEFAULTS.prepare);
    setCompletion(c.completionTargetPct ?? DEFAULTS.completion);
    setMissed(c.missedCeiling ?? DEFAULTS.missed);
    setCapacity(c.weeklyCapacity ?? DEFAULTS.capacity);
  }, [data]);

  const save = useMutation({
    mutationFn: (input: Commitments) => saveCommitments(input),
    onSuccess: (view) => {
      queryClient.setQueryData(['goals'], view);
      void queryClient.invalidateQueries({ queryKey: ['calendar'] }); // capacity feeds the meter
      void queryClient.invalidateQueries({ queryKey: ['today'] });
      setEditing(false);
    },
  });

  if (isPending) {
    return (
      <Shell>
        <p className="px-6 pt-12 text-[15px] text-dim">…</p>
      </Shell>
    );
  }
  if (isError || !data) {
    return (
      <Shell>
        <p className="px-6 pt-12 text-[15px] text-dim">Can't reach the API — is `npm run dev` running?</p>
      </Shell>
    );
  }

  const { progress, commitments } = data;
  const showSetup = editing || !progress.hasCommitments;

  if (showSetup && !progress.hasCommitments && !editing) {
    // Empty state — no commitments yet.
    return (
      <Shell>
        <main className="mx-auto w-full max-w-[560px] flex-1 px-6 pt-12">
          <Eyebrow tone="dim">{GOALS_EMPTY_EYEBROW}</Eyebrow>
          <Command>{GOALS_EMPTY_COMMAND}</Command>
          <ICard className="mt-8">
            <div className="flex flex-col items-center gap-4 px-8 py-14 text-center">
              <span className="flex size-11 items-center justify-center rounded-full border border-ink/12 text-[18px] text-dim">○</span>
              <p className="max-w-[42ch] text-[15px] leading-relaxed text-dim">{GOALS_EMPTY_BODY}</p>
              <BtnPrimary className="mt-1 px-8" onClick={() => setEditing(true)}>
                {GOALS_EMPTY_CTA}
              </BtnPrimary>
            </div>
          </ICard>
        </main>
      </Shell>
    );
  }

  if (showSetup) {
    return (
      <Shell>
        <main className="mx-auto w-full max-w-[640px] flex-1 px-6 pt-12 pb-8">
          <Eyebrow tone="dim">{GOALS_SETUP_EYEBROW}</Eyebrow>
          <Command sub={GOALS_SETUP_SUB}>{GOALS_SETUP_COMMAND}</Command>
          <ICard className="mt-8">
            <div className="px-7 py-2">
              <Stepper label="Publish this week" value={publish} unit="posts" min={1} max={50} onChange={setPublish} />
              <Stepper label="Prepare ahead" helper="ready before they're due" value={prepare} unit="posts" min={0} max={50} onChange={setPrepare} />
              <Stepper label="Completion target" helper="of planned posts, actually posted" value={completion} unit="%" min={0} max={100} step={5} onChange={setCompletion} />
              <Stepper label="Keep missed under" value={missed} unit="posts" min={0} max={50} onChange={setMissed} />
              <Stepper label="Weekly content capacity" helper="used to flag heavy weeks — inline, no settings screen" value={capacity} unit="effort pts" min={1} max={100} onChange={setCapacity} />
            </div>
          </ICard>
          <div className="mt-5 flex gap-3">
            <BtnPrimary
              className="flex-1 py-3"
              disabled={save.isPending}
              onClick={() =>
                save.mutate({
                  weeklyPublishTarget: publish,
                  prepareAheadTarget: prepare,
                  completionTargetPct: completion,
                  missedCeiling: missed,
                  weeklyCapacity: capacity,
                })
              }
            >
              {GOALS_SAVE}
            </BtnPrimary>
            {progress.hasCommitments && (
              <BtnSecondary className="px-6" onClick={() => setEditing(false)}>
                Cancel
              </BtnSecondary>
            )}
          </div>
          <div className="mt-5 rounded-xl border border-dashed border-ink/15 px-6 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-dim">{GOALS_BANNED_LABEL}</p>
            <div className="mt-2.5 flex flex-wrap gap-5 text-[13.5px] text-ink/35">
              {GOALS_BANNED.map((b) => (
                <span key={b} className="line-through">
                  {b}
                </span>
              ))}
            </div>
          </div>
        </main>
      </Shell>
    );
  }

  // Progress view
  const { verdict } = progress;
  const pill = goalVerdictPill(verdict);
  const ranShort = verdict === 'ran_short';
  return (
    <Shell>
      <main className="mx-auto w-full max-w-[560px] flex-1 px-6 pt-10 pb-10">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-dim">Goal progress · reads the shared derived metrics</p>
          <button type="button" className="text-[13px] font-medium text-accent hover:underline" onClick={() => setEditing(true)}>
            {GOALS_EDIT}
          </button>
        </div>
        <ICard>
          <div className="flex items-center justify-between gap-4 px-7 pt-6 pb-3">
            <h2 className="text-[18px] font-semibold">{GOALS_PROGRESS_TITLE}</h2>
            {pill && <StatusPill tone={pill[0]}>{pill[1]}</StatusPill>}
          </div>
          <div className="px-7 pb-3 pt-2">
            {commitments.weeklyPublishTarget !== null && (
              <GoalMeter
                label="Published"
                value={progress.published.value}
                total={progress.published.total ?? 0}
                tone={ranShort && progress.published.value < (progress.published.total ?? 0) ? 'late' : undefined}
              />
            )}
            {commitments.prepareAheadTarget !== null && (
              <GoalMeter
                label="Prepared ahead"
                value={progress.preparedAhead.value}
                total={progress.preparedAhead.total ?? 0}
                tone={ranShort && progress.preparedAhead.value < (progress.preparedAhead.total ?? 0) ? 'late' : undefined}
              />
            )}
            {commitments.completionTargetPct !== null && (
              <GoalMeter
                label="Completion"
                value={progress.completion.value}
                total={100}
                note={`target ${progress.completion.total}%`}
                tone={ranShort && progress.completion.value < (progress.completion.total ?? 0) ? 'late' : undefined}
              />
            )}
            {commitments.missedCeiling !== null && (
              <GoalMeter
                label="Missed"
                value={progress.missed.value}
                total={progress.missed.total ?? 0}
                note={
                  progress.missed.value >= (progress.missed.total ?? 0)
                    ? `at your limit of ${progress.missed.total}`
                    : `under your limit of ${progress.missed.total}`
                }
                tone={progress.missed.value >= (progress.missed.total ?? 0) ? 'missed' : undefined}
              />
            )}
          </div>
          <div className="border-t border-ink/8 px-7 py-5">
            <p className="font-serif text-[16.5px] italic leading-relaxed text-ink/80">
              {`“${goalVerdictLine(verdict, commitments.weeklyPublishTarget)}”`}
            </p>
          </div>
        </ICard>
        {/* Phase 2 (D-50): contextual Weekly Review entry from Goals. */}
        <div className="mt-5 text-center">
          <Link to="/review" className="text-[13px] font-medium text-accent hover:underline">
            {REVIEW_THIS_WEEK} →
          </Link>
        </div>
      </main>
    </Shell>
  );
}
