// Phase 2 — Weekly Review. Functional-first in the Instrument system; calm, input-focused, never a
// performance dashboard. Summary reads the shared derived metrics (ADR-3); reflection is user-authored.
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchWeeklyReview, saveReflection } from '../api/client';
import type { Reflection } from '../api/types';
import { BtnPrimary, BtnSecondary, Command, Eyebrow, ICard, IField, IHeader, Readout } from '../components/ui';
import {
  WR_BLOCKERS_LABEL,
  WR_BLOCKERS_PH,
  WR_COMMAND,
  WR_EYEBROW,
  WR_PLAN_NEXT,
  WR_REFLECT_LABEL,
  WR_REPEAT_LABEL,
  WR_REPEAT_PH,
  WR_SAVE,
  WR_SAVED,
  WR_STOP_LABEL,
  WR_STOP_PH,
  WR_SUB,
  wrHeadline,
} from '../lib/microcopy';

function Shell({ right, children }: { right: string; children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-paper font-sans text-ink antialiased">
      <IHeader back="Today" right={right} />
      {children}
    </div>
  );
}

export function WeeklyReviewPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data, isPending, isError } = useQuery({ queryKey: ['weekly-review'], queryFn: fetchWeeklyReview });

  const [blockers, setBlockers] = useState('');
  const [repeat, setRepeat] = useState('');
  const [stop, setStop] = useState('');
  const [savedFlash, setSavedFlash] = useState(false);

  useEffect(() => {
    if (!data) return;
    setBlockers(data.reflection.blockers);
    setRepeat(data.reflection.repeat);
    setStop(data.reflection.stop);
  }, [data]);

  const save = useMutation({
    mutationFn: (input: Reflection) => saveReflection(input),
    onSuccess: (view) => {
      queryClient.setQueryData(['weekly-review'], view);
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 1500);
    },
  });

  if (isPending) {
    return (
      <Shell right="Weekly review">
        <p className="px-6 pt-12 text-[15px] text-dim">…</p>
      </Shell>
    );
  }
  if (isError || !data) {
    return (
      <Shell right="Weekly review">
        <p className="px-6 pt-12 text-[15px] text-dim">Can't reach the API — is `npm run dev` running?</p>
      </Shell>
    );
  }

  const m = data.metrics;

  return (
    <Shell right={data.label}>
      <main className="mx-auto w-full max-w-[660px] flex-1 px-6 pt-12 pb-12">
        <Eyebrow tone="dim">{WR_EYEBROW}</Eyebrow>
        <Command sub={WR_SUB}>{WR_COMMAND}</Command>

        {/* What was planned / what shipped / what got stuck — derived, calm, not a dashboard. */}
        <ICard className="mt-8">
          <p className="px-7 pt-6 pb-1 font-serif text-[17px] italic text-ink/80">{wrHeadline(m.planned, m.published)}</p>
          <Readout
            cells={[
              ['Planned', <span key="p">{m.planned}</span>],
              [
                'Shipped',
                <span key="s">
                  {m.published}
                  {m.published > 0 && (
                    <span className="ml-1.5 text-[12px] font-normal text-dim">
                      {m.onTime} on-time · {m.late} late
                    </span>
                  )}
                </span>,
              ],
              ['Missed', <span key="m" className={m.missed > 0 ? 'text-missed' : ''}>{m.missed}</span>],
              ['Execution', <span key="e">{m.executionScore}</span>],
            ]}
          />
          <p className="px-7 py-3.5 text-[13px] text-dim">
            Completion {m.completionPct}% · On-time {m.onTimePct}% of shipped. These are inputs you control — not reach.
          </p>
        </ICard>

        {/* Reflection — user-authored learning artifacts (blockers / repeat / stop). */}
        <p className="mt-9 mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-dim">{WR_REFLECT_LABEL}</p>
        <ICard>
          <div className="flex flex-col gap-5 px-7 py-6">
            <IField label={WR_BLOCKERS_LABEL} textarea rows={2} value={blockers} placeholder={WR_BLOCKERS_PH} onChange={setBlockers} />
            <IField label={WR_REPEAT_LABEL} textarea rows={2} value={repeat} placeholder={WR_REPEAT_PH} onChange={setRepeat} />
            <IField label={WR_STOP_LABEL} textarea rows={2} value={stop} placeholder={WR_STOP_PH} onChange={setStop} />
            <div className="flex items-center justify-end">
              <BtnSecondary className="px-6" disabled={save.isPending} onClick={() => save.mutate({ blockers, repeat, stop })}>
                {savedFlash ? WR_SAVED : WR_SAVE}
              </BtnSecondary>
            </div>
          </div>
        </ICard>

        {/* What should change next week — placeholder handoff into the planner (D-51). */}
        <div className="mt-6 flex justify-center">
          <BtnPrimary className="px-8" onClick={() => navigate('/calendar')}>
            {WR_PLAN_NEXT}
          </BtnPrimary>
        </div>
      </main>
    </Shell>
  );
}
