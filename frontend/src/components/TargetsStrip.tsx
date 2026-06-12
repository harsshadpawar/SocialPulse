// Post-count targets (D-32/D-33): a dim, informational strip — never red, no streaks, no nagging.
// Targets are data, edited right here. Both unset → collapses to a quiet affordance.
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { updateTarget } from '../api/client';
import type { TodayView } from '../api/types';

const INPUT =
  'w-16 rounded-md border border-ink/15 bg-white px-2 py-1 text-center text-[13px] text-ink focus:outline-2 focus:outline-accent/60';

export function TargetsStrip({ today }: { today: TodayView }) {
  const [editing, setEditing] = useState(false);
  const [daily, setDaily] = useState('');
  const [weekly, setWeekly] = useState('');
  const queryClient = useQueryClient();

  const { dailyTarget, weeklyTarget } = today.target;
  const hasAny = dailyTarget !== null || weeklyTarget !== null;

  const save = useMutation({
    mutationFn: () =>
      updateTarget({
        dailyTarget: daily.trim() === '' ? null : Number(daily),
        weeklyTarget: weekly.trim() === '' ? null : Number(weekly),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['today'] });
      setEditing(false);
    },
  });

  function openEditor() {
    setDaily(dailyTarget?.toString() ?? '');
    setWeekly(weeklyTarget?.toString() ?? '');
    setEditing(true);
  }

  if (editing) {
    return (
      <div className="mt-3 flex items-center justify-center gap-3 text-[13px] text-dim">
        <label className="flex items-center gap-1.5">
          per day
          <input className={INPUT} inputMode="numeric" value={daily} onChange={(e) => setDaily(e.target.value)} placeholder="—" />
        </label>
        <label className="flex items-center gap-1.5">
          per week
          <input className={INPUT} inputMode="numeric" value={weekly} onChange={(e) => setWeekly(e.target.value)} placeholder="—" />
        </label>
        <button
          type="button"
          className="rounded-md bg-accent px-3 py-1 text-[12.5px] font-semibold text-white hover:brightness-105 disabled:opacity-40"
          disabled={save.isPending}
          onClick={() => save.mutate()}
        >
          Save
        </button>
        <button type="button" className="text-[12.5px] text-dim hover:text-ink" onClick={() => setEditing(false)}>
          Cancel
        </button>
        {save.isError && <span className="text-[12.5px]">{save.error.message}</span>}
      </div>
    );
  }

  if (!hasAny) {
    return (
      <button
        type="button"
        onClick={openEditor}
        className="mx-auto mt-3 block text-[12.5px] text-ink/35 hover:text-dim"
      >
        + posting targets
      </button>
    );
  }

  const parts: string[] = [];
  if (dailyTarget !== null) parts.push(`Today ${today.postedOnDayCount}/${dailyTarget}`);
  if (weeklyTarget !== null) parts.push(`This week ${today.postedInWeekCount}/${weeklyTarget}`);

  return (
    <button
      type="button"
      onClick={openEditor}
      title="Click to edit targets"
      className="mx-auto mt-3 block text-[13px] tabular-nums text-dim hover:text-ink"
    >
      {parts.join(' · ')}
    </button>
  );
}
