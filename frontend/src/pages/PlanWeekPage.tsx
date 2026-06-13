// v0.2g (D-53): "Plan week from this idea" — progressive disclosure (platforms → cadence → proposed
// pieces → accept/remove → schedule or save as drafts). Fixed-ladder proposer, live effort guardrail.
// SocialPulse never writes copy — captions seed from the idea; you paste your own/AI-drafted copy.
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchPost, planWeek } from '../api/client';
import type { Format, Platform } from '../api/types';
import { BtnPrimary, BtnSecondary, Command, Eyebrow, ICard, IHeader } from '../components/ui';
import { FORMAT_META } from '../lib/formatMeta';
import { PLATFORM_META } from '../lib/platform';
import { CADENCES, effortPoints, loadFor, proposeDateStr, proposeWeekPieces } from '../lib/planWeek';
import type { Cadence } from '../lib/planWeek';

const ALL_PLATFORMS: Platform[] = ['linkedin', 'x', 'youtube', 'instagram'];

interface Piece {
  platform: Platform;
  format: Format;
  included: boolean;
  dateKey: string; // YYYY-MM-DD, editable/clearable ('' = draft)
}

function tomorrowKey(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

const EFFORT_DOT: Record<string, string> = { low: 'text-dim', medium: 'text-accent', high: 'text-late' };

// Module-level so it isn't re-created each render (which would remount children and drop input focus).
function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-paper font-sans text-ink antialiased">
      <IHeader back="Today" right="Plan week" />
      {children}
    </div>
  );
}

export function PlanWeekPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: post, isPending, isError } = useQuery({ queryKey: ['post', id], queryFn: () => fetchPost(id!), enabled: id !== undefined });

  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [cadence, setCadence] = useState<Cadence>('light');
  const [startKey, setStartKey] = useState<string>(tomorrowKey());
  const [pieces, setPieces] = useState<Piece[]>([]);

  // Seed the platform with the hub's platform once loaded.
  useEffect(() => {
    if (post && platforms.length === 0) setPlatforms([post.platform]);
  }, [post]); // eslint-disable-line react-hooks/exhaustive-deps

  // Regenerate the proposal when platforms / cadence / start change (excludes the hub's own piece).
  useEffect(() => {
    if (!post) return;
    const proposed = proposeWeekPieces(platforms, cadence).filter(
      (p) => !(p.platform === post.platform && p.format === post.format),
    );
    setPieces(proposed.map((p, i) => ({ ...p, included: true, dateKey: proposeDateStr(i, cadence, startKey) })));
  }, [post, platforms, cadence, startKey]);

  const create = useMutation({
    mutationFn: (asDrafts: boolean) =>
      planWeek(
        id!,
        pieces
          .filter((p) => p.included)
          .map((p) => ({
            platform: p.platform,
            format: p.format,
            targetDatetime: asDrafts || p.dateKey === '' ? null : new Date(`${p.dateKey}T09:00`).toISOString(),
          })),
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['today'] });
      void queryClient.invalidateQueries({ queryKey: ['calendar'] });
      navigate('/calendar');
    },
  });

  if (isPending) return <Shell><p className="px-6 pt-12 text-[15px] text-dim">…</p></Shell>;
  if (isError || !post) return <Shell><p className="px-6 pt-12 text-[15px] text-dim">Couldn't load this idea.</p></Shell>;

  const active = pieces.filter((p) => p.included);
  const totalPts = active.reduce((s, p) => s + effortPoints(p.format), 0);
  const load = loadFor(totalPts);
  const loadTone = load === 'full' ? 'text-late' : load === 'moderate' ? 'text-accent' : 'text-dim';

  function togglePlatform(p: Platform) {
    setPlatforms((cur) => (cur.includes(p) ? cur.filter((x) => x !== p) : [...cur, p]));
  }

  return (
    <Shell>
      <main className="mx-auto w-full max-w-[620px] flex-1 px-6 pt-12 pb-12">
        <Eyebrow tone="dim">Plan week</Eyebrow>
        <Command sub="One idea → a set of platform-ready pieces. Pick platforms and how much — SocialPulse proposes, you decide. Paste your own copy after.">
          Plan a week from “{post.ideaTitle}”.
        </Command>

        {/* Step 1 — platforms */}
        <p className="mt-9 mb-2.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-dim">Which platforms?</p>
        <div className="flex flex-wrap gap-2.5">
          {ALL_PLATFORMS.map((p) => {
            const on = platforms.includes(p);
            return (
              <button
                key={p}
                type="button"
                onClick={() => togglePlatform(p)}
                className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-[14px] font-medium ${
                  on ? 'border-accent/40 bg-accent/8 text-ink' : 'border-ink/15 text-dim hover:text-ink'
                }`}
              >
                <span className="size-[7px] rounded-full" style={{ backgroundColor: PLATFORM_META[p].color }} />
                {PLATFORM_META[p].label}
              </button>
            );
          })}
        </div>

        {/* Step 2 — cadence */}
        {platforms.length > 0 && (
          <>
            <p className="mt-8 mb-2.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-dim">How much this week?</p>
            <div className="inline-flex gap-1 rounded-lg bg-ink/5 p-1 text-[13.5px]">
              {CADENCES.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCadence(c.id)}
                  title={c.hint}
                  className={`rounded-md px-4 py-1.5 ${
                    cadence === c.id ? 'bg-white font-semibold text-ink shadow-[0_1px_2px_rgba(40,35,25,0.08)]' : 'text-dim hover:text-ink'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
            <p className="mt-2 text-[12.5px] text-dim">
              {cadence === 'light' ? 'Light keeps it realistic' : CADENCES.find((c) => c.id === cadence)?.label} —{' '}
              {CADENCES.find((c) => c.id === cadence)?.hint}.
            </p>
          </>
        )}

        {/* Empty proposal — e.g. only the hub's own platform at Light (its piece is excluded). */}
        {platforms.length > 0 && pieces.length === 0 && (
          <p className="mt-8 max-w-[60ch] text-[14px] leading-relaxed text-dim">
            Nothing new to add yet — your idea is already a {FORMAT_META[post.format].label} on {PLATFORM_META[post.platform].label}. Add
            another platform, or bump the cadence to Medium or Heavy for more pieces.
          </p>
        )}

        {/* Step 3 — proposed pieces */}
        {platforms.length > 0 && pieces.length > 0 && (
          <>
            <div className="mt-8 mb-2.5 flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-dim">Proposed — accept or remove</p>
              <label className="flex items-center gap-2 text-[12.5px] text-dim">
                Start
                <input
                  type="date"
                  value={startKey}
                  onChange={(e) => setStartKey(e.target.value)}
                  className="rounded-md border border-ink/15 bg-white px-2 py-1 text-[12.5px] text-ink focus:outline-2 focus:outline-accent/60"
                />
              </label>
            </div>
            <ICard>
              <div className="divide-y divide-ink/8">
                {pieces.map((p, i) => (
                  <div key={`${p.platform}-${p.format}-${i}`} className="flex items-center gap-3 px-5 py-3">
                    <input
                      type="checkbox"
                      checked={p.included}
                      onChange={(e) => setPieces((cur) => cur.map((x, j) => (j === i ? { ...x, included: e.target.checked } : x)))}
                      className="size-4 accent-[oklch(49%_0.08_200)]"
                    />
                    <span className="size-[7px] rounded-full" style={{ backgroundColor: PLATFORM_META[p.platform].color }} />
                    <span className={`text-[14px] ${p.included ? '' : 'text-ink/40 line-through'}`}>
                      {PLATFORM_META[p.platform].label} · {FORMAT_META[p.format].label}
                    </span>
                    <span className={`text-[11px] font-semibold uppercase tracking-wide ${EFFORT_DOT[effortPoints(p.format) === 1 ? 'low' : effortPoints(p.format) === 2 ? 'medium' : 'high']}`}>
                      {effortPoints(p.format) === 1 ? 'low' : effortPoints(p.format) === 2 ? 'med' : 'high'}
                    </span>
                    <input
                      type="date"
                      value={p.dateKey}
                      disabled={!p.included}
                      onChange={(e) => setPieces((cur) => cur.map((x, j) => (j === i ? { ...x, dateKey: e.target.value } : x)))}
                      className="ml-auto rounded-md border border-ink/15 bg-white px-2 py-1 text-[12.5px] text-ink focus:outline-2 focus:outline-accent/60 disabled:bg-ink/3 disabled:text-ink/40"
                    />
                  </div>
                ))}
              </div>
            </ICard>

            {/* Live effort guardrail (D-53 §4) */}
            <p className={`mt-3 text-center text-[13px] font-medium ${loadTone}`}>
              {active.length} {active.length === 1 ? 'piece' : 'pieces'} · {totalPts} effort {totalPts === 1 ? 'point' : 'points'} · {load} load
              {load === 'full' && <span className="font-normal"> — heavy; consider removing one.</span>}
            </p>

            <div className="mt-5 flex gap-3">
              <BtnPrimary
                className="flex-1 py-3"
                disabled={active.length === 0 || create.isPending}
                onClick={() => create.mutate(false)}
              >
                Create {active.length} {active.length === 1 ? 'piece' : 'pieces'}
              </BtnPrimary>
              <BtnSecondary className="px-6" disabled={active.length === 0 || create.isPending} onClick={() => create.mutate(true)}>
                Save as drafts
              </BtnSecondary>
            </div>
            {create.isError && <p className="mt-3 text-center text-[13px] text-dim">{create.error.message}</p>}
          </>
        )}
      </main>
    </Shell>
  );
}
