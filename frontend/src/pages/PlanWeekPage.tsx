// v0.2g (D-53) → v0.2j (D-60..D-63): "Plan week from this idea" — hub-and-spoke planning, rebuilt to the
// approved hi-fi. Apply-to-all scheduling (baseline + explicit Apply; per-row edits persist with a dot —
// the reset bug designed out), custom Instrument date+time control, pinned hub caption, calm states.
// SocialPulse never writes copy — captions seed from the idea; you paste your own/AI-drafted copy.
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchPost, planWeek } from '../api/client';
import type { Format, Platform } from '../api/types';
import { BtnPrimary, BtnSecondary, Command, Eyebrow, IHeader } from '../components/ui';
import { DateTimePicker } from '../components/DateTimePicker';
import { FORMAT_META } from '../lib/formatMeta';
import { PLATFORM_META } from '../lib/platform';
import { CADENCES, DEFAULT_TIME, effortPoints, loadFor, proposeWeekPieces } from '../lib/planWeek';
import type { Cadence } from '../lib/planWeek';

const ALL_PLATFORMS: Platform[] = ['linkedin', 'x', 'youtube', 'instagram'];

interface Piece {
  platform: Platform;
  format: Format;
  included: boolean;
  dateKey: string; // 'YYYY-MM-DDTHH:mm' or '' (drafts via the Save action)
  edited: boolean; // hand-edited → keep; Apply-to-all skips it unless confirmed
}

function tomorrowKey(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

// Effort-tag palette (mirrors the product's progressing-green scale).
const EFF_STYLE: Record<string, React.CSSProperties> = {
  LOW: { backgroundColor: 'oklch(72% 0.09 155 / 0.16)', color: 'oklch(40% 0.1 155)' },
  MED: { backgroundColor: 'oklch(58% 0.1 155 / 0.2)', color: 'oklch(33% 0.11 155)' },
  HIGH: { backgroundColor: 'oklch(46% 0.11 155)', color: '#fff' },
};
const effLevel = (f: Format): 'LOW' | 'MED' | 'HIGH' => (effortPoints(f) === 1 ? 'LOW' : effortPoints(f) === 2 ? 'MED' : 'HIGH');

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
  const [baseDate, setBaseDate] = useState<string>(tomorrowKey());
  const [baseTime, setBaseTime] = useState<string>(DEFAULT_TIME);
  const [spacing, setSpacing] = useState<number>(1);
  const [pieces, setPieces] = useState<Piece[]>([]);
  const [draftsSaved, setDraftsSaved] = useState(false);

  // Current baseline values for the spread, read at apply/regen time (kept in a ref so regen doesn't
  // depend on them — changing the baseline must NOT auto-rewrite rows; only "Apply to all" does).
  const baseRef = useRef({ baseDate, baseTime, spacing });
  baseRef.current = { baseDate, baseTime, spacing };

  function spreadDate(slot: number): string {
    const { baseDate: bd, baseTime: bt, spacing: sp } = baseRef.current;
    const [y, m, d] = bd.split('-').map(Number);
    const dt = new Date(Date.UTC(y!, m! - 1, d! + slot * sp, 12));
    return `${dt.toISOString().slice(0, 10)}T${bt}`;
  }

  // Seed the platform with the hub's platform once loaded.
  useEffect(() => {
    if (post && platforms.length === 0) setPlatforms([post.platform]);
  }, [post]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reconcile proposed pieces when platforms/cadence change — PRESERVE existing rows (incl. hand-edits);
  // only brand-new pieces get a baseline-spread datetime. Excludes the hub's own piece.
  useEffect(() => {
    if (!post) return;
    const proposed = proposeWeekPieces(platforms, cadence).filter((p) => !(p.platform === post.platform && p.format === post.format));
    setPieces((prev) => {
      const byKey = new Map(prev.map((p) => [`${p.platform}|${p.format}`, p]));
      return proposed.map((pp, i) => byKey.get(`${pp.platform}|${pp.format}`) ?? { platform: pp.platform, format: pp.format, included: true, dateKey: spreadDate(i), edited: false });
    });
  }, [post, platforms, cadence]); // eslint-disable-line react-hooks/exhaustive-deps

  const create = useMutation({
    mutationFn: (asDrafts: boolean) =>
      planWeek(
        id!,
        pieces
          .filter((p) => p.included)
          .map((p) => ({
            platform: p.platform,
            format: p.format,
            targetDatetime: asDrafts || p.dateKey === '' ? null : new Date(p.dateKey).toISOString(),
          })),
      ),
    onSuccess: (_data, asDrafts) => {
      void queryClient.invalidateQueries({ queryKey: ['today'] });
      void queryClient.invalidateQueries({ queryKey: ['calendar'] });
      if (asDrafts) setDraftsSaved(true); // stay and confirm — drafts aren't dated, so the calendar would look empty
      else navigate('/calendar');
    },
  });

  if (isPending) return <Shell><p className="px-6 pt-12 text-[15px] text-dim">…</p></Shell>;
  if (isError || !post) return <Shell><p className="px-6 pt-12 text-[15px] text-dim">Couldn't load this idea.</p></Shell>;

  const active = pieces.filter((p) => p.included);
  const totalPts = active.reduce((s, p) => s + effortPoints(p.format), 0);
  const load = loadFor(totalPts);
  const overloaded = load === 'full';
  const showProposed = platforms.length > 0;

  function togglePlatform(p: Platform) {
    setDraftsSaved(false);
    setPlatforms((cur) => (cur.includes(p) ? cur.filter((x) => x !== p) : [...cur, p]));
  }

  // The only thing that rewrites row datetimes. Skips hand-edited rows unless the user confirms.
  function applyToAll() {
    const editedCount = pieces.filter((p) => p.included && p.edited).length;
    let overwriteEdited = false;
    if (editedCount > 0) {
      overwriteEdited = window.confirm(`Also reset ${editedCount} hand-edited time${editedCount > 1 ? 's' : ''}? Cancel keeps them as you set them.`);
    }
    // Counter lives INSIDE the updater so it resets per invocation — React StrictMode double-invokes
    // updaters in dev, and a counter declared outside would keep climbing and over-spread the dates.
    setPieces((cur) => {
      let slot = 0;
      return cur.map((p) => {
        if (!p.included) return p;
        const here = slot++;
        if (p.edited && !overwriteEdited) return p;
        return { ...p, dateKey: spreadDate(here), edited: false };
      });
    });
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
                className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[14px] font-medium ${
                  on ? 'border-accent/40 bg-accent/8 text-ink' : 'border-ink/15 text-dim hover:text-ink'
                }`}
              >
                <span className="size-[7px] rounded-full" style={{ backgroundColor: PLATFORM_META[p].color, opacity: on ? 1 : 0.4 }} />
                {PLATFORM_META[p].label}
                {on && <span className="text-accent">✓</span>}
              </button>
            );
          })}
        </div>

        {/* Step 2 — cadence */}
        {showProposed && (
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

        {/* Step 3 — proposed */}
        {showProposed && (
          <div className="mt-8">
            <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-dim">Proposed — accept or remove</p>

            {/* Pinned hub caption — the idea's own post: different in kind, not removable, not counted. */}
            <div className="flex items-center gap-3 rounded-lg border border-ink/10 bg-ink/[0.03] px-4 py-3">
              <svg className="size-4 shrink-0 text-dim" viewBox="0 0 16 16" fill="none">
                <path d="M5 2h6M8 2v5M5 7h6l-1 3H6L5 7zM8 10v4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <div className="min-w-0">
                <p className="truncate text-[14px] font-semibold">“{post.ideaTitle}”</p>
                <p className="mt-0.5 flex items-center gap-1.5 text-[12.5px] text-dim">
                  <span className="size-[6px] rounded-full" style={{ backgroundColor: PLATFORM_META[post.platform].color }} />
                  {PLATFORM_META[post.platform].label} · {FORMAT_META[post.format].label}
                </p>
              </div>
              <span className="ml-auto shrink-0 rounded-full bg-ink/6 px-3 py-1 text-[12px] font-medium text-dim">Already a post</span>
            </div>

            {pieces.length === 0 ? (
              <div className="mt-2.5 rounded-lg border border-dashed border-ink/15 px-5 py-5 text-center text-[14px] leading-relaxed text-dim">
                No new pieces yet — add another platform, or bump the cadence to Medium or Heavy.
              </div>
            ) : (
              <>
                {/* Schedule-all bar — baseline + explicit Apply. Changing the baseline does NOT rewrite rows. */}
                <div className="mt-2.5 flex flex-wrap items-center gap-3 rounded-lg border border-ink/10 bg-paper px-4 py-2.5">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-dim">Schedule all</span>
                  <span className="inline-flex items-center gap-2 text-[13px] text-dim">
                    from
                    <DateTimePicker
                      value={`${baseDate}T${baseTime}`}
                      onChange={(v) => {
                        const [d, t] = v.split('T');
                        if (d) setBaseDate(d);
                        if (t) setBaseTime(t);
                      }}
                    />
                  </span>
                  <span className="inline-flex items-center gap-2 text-[13px] text-dim">
                    · spacing
                    <select
                      value={spacing}
                      onChange={(e) => setSpacing(Number(e.target.value))}
                      className="rounded-md border border-ink/15 bg-white px-2 py-1 text-[12.5px] font-medium text-ink"
                    >
                      <option value={1}>every 1 day</option>
                      <option value={2}>every 2 days</option>
                      <option value={3}>every 3 days</option>
                    </select>
                  </span>
                  <button
                    type="button"
                    onClick={applyToAll}
                    className="ml-auto rounded-lg border border-ink/20 bg-white px-4 py-1.5 text-[13.5px] font-medium hover:bg-ink/5"
                  >
                    Apply to all
                  </button>
                </div>

                {/* Spoke rows */}
                <div className={`mt-2.5 flex flex-col gap-2.5 ${pieces.length > 6 ? 'max-h-[320px] overflow-auto pr-1' : ''}`}>
                  {pieces.map((p, i) => {
                    const lvl = effLevel(p.format);
                    return (
                      <div
                        key={`${p.platform}-${p.format}-${i}`}
                        className="flex flex-col gap-2 rounded-lg border border-ink/12 bg-white px-3.5 py-2.5 sm:flex-row sm:items-center sm:gap-3"
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={p.included}
                            onChange={(e) => setPieces((cur) => cur.map((x, j) => (j === i ? { ...x, included: e.target.checked } : x)))}
                            className="size-4 accent-[oklch(49%_0.08_200)]"
                          />
                          <span className="size-[7px] shrink-0 rounded-full" style={{ backgroundColor: PLATFORM_META[p.platform].color }} />
                          <span className={`whitespace-nowrap text-[14px] font-medium ${p.included ? '' : 'text-ink/40 line-through'}`}>
                            {PLATFORM_META[p.platform].label} · {FORMAT_META[p.format].label}
                          </span>
                          <span className="rounded px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-[0.06em]" style={EFF_STYLE[lvl]}>
                            {lvl}
                          </span>
                        </div>
                        <div className="pl-7 sm:ml-auto sm:pl-0">
                          <DateTimePicker
                            value={p.dateKey}
                            edited={p.edited}
                            disabled={!p.included}
                            onChange={(v) => setPieces((cur) => cur.map((x, j) => (j === i ? { ...x, dateKey: v, edited: true } : x)))}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Effort line + actions */}
                <div className="mt-6 flex flex-col gap-4 max-sm:sticky max-sm:bottom-0 max-sm:-mx-6 max-sm:border-t max-sm:border-ink/10 max-sm:bg-paper max-sm:px-6 max-sm:pt-3 max-sm:pb-2">
                  <p className={`text-center text-[14px] font-medium ${overloaded ? 'text-late' : 'text-dim'}`}>
                    <span className="text-ink">
                      {active.length} new {active.length === 1 ? 'piece' : 'pieces'}
                    </span>{' '}
                    · {totalPts} effort {totalPts === 1 ? 'point' : 'points'} · {load} load
                    {overloaded && <span> — heavy; consider removing one.</span>}
                  </p>

                  {draftsSaved ? (
                    <div className="flex items-center gap-3 rounded-xl border border-success/25 bg-success/[0.05] px-5 py-4">
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-success text-[13px] text-white">✓</span>
                      <p className="text-[14px] leading-relaxed">
                        {active.length} {active.length === 1 ? 'piece' : 'pieces'} saved as <b>drafts</b> — no dates set. They're in your idea's editor, ready when you are.
                      </p>
                      <BtnSecondary className="ml-auto shrink-0 px-4" onClick={() => navigate('/calendar')}>Calendar</BtnSecondary>
                    </div>
                  ) : create.isError ? (
                    <>
                      <div className="rounded-xl border border-missed/25 bg-missed/[0.05] px-5 py-3.5 text-[14px] leading-relaxed text-ink/85">
                        Couldn't create the pieces just now — your picks and times are saved. Try again.
                      </div>
                      <div className="flex gap-3">
                        <BtnPrimary className="flex-1 py-3" disabled={active.length === 0 || create.isPending} onClick={() => create.mutate(false)}>
                          Retry · Create {active.length} {active.length === 1 ? 'piece' : 'pieces'}
                        </BtnPrimary>
                        <BtnSecondary className="flex-1" disabled={active.length === 0 || create.isPending} onClick={() => create.mutate(true)}>
                          Save as drafts
                        </BtnSecondary>
                      </div>
                    </>
                  ) : create.isPending ? (
                    <BtnPrimary className="w-full py-3 opacity-80" disabled>
                      Creating {active.length} {active.length === 1 ? 'piece' : 'pieces'}…
                    </BtnPrimary>
                  ) : (
                    <div className="flex gap-3">
                      <BtnPrimary className="flex-1 py-3" disabled={active.length === 0} onClick={() => create.mutate(false)}>
                        Create {active.length} {active.length === 1 ? 'piece' : 'pieces'}
                      </BtnPrimary>
                      <BtnSecondary className="flex-1" disabled={active.length === 0} onClick={() => create.mutate(true)}>
                        Save as drafts
                      </BtnSecondary>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </main>
    </Shell>
  );
}
