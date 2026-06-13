// Post Editor — hi-fi staged mini-workflow (hifi/hifi-editor.jsx): Prepare → Schedule → Publish.
// When Ready, A & B compress to done-strips with an Edit reopen; C unlocks (gains weight at Due).
// All status logic is server-derived (ADR-3); this page renders and mutates only.
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchPost, markReady, quickStart, repurpose, updatePost } from '../api/client';
import type { Format, Platform, PostView, ReadyMissing } from '../api/types';
import { MarkPostedSheet } from '../components/MarkPostedSheet';
import { ResultCard } from '../components/ResultCard';
import { BtnPrimary, BtnSecondary, Eyebrow, ICard, IField, IHeader, ISelect, PlatformBadge } from '../components/ui';
import { formatTargetLine, formatTime } from '../lib/format';
import {
  EFFORT_LABEL,
  MARK_POSTED,
  MARK_READY,
  MISSED_MESSAGE,
  PUBLISH_LOCKED,
  QUICK_START,
  QUICK_START_HELPER,
  READY_CONFIRM,
  READY_GUIDANCE,
  REPURPOSE_HEADING,
  REPURPOSE_HELPER,
  SAVE_DRAFT,
  SCHEDULE_HELPER,
  captionPlaceholder,
  dueMessage,
  repurposeToLabel,
} from '../lib/microcopy';
import { PLATFORM_META } from '../lib/platform';

const PLATFORM_FORMAT: Record<Platform, Format> = {
  linkedin: 'text_post',
  x: 'short_post',
  youtube: 'short_video',
  instagram: 'reel',
};

const PLATFORM_OPTIONS = (Object.keys(PLATFORM_META) as Platform[]).map((p) => ({
  value: p,
  label: PLATFORM_META[p].label,
}));

function isoToLocalInput(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function localInputToIso(value: string): string | null {
  return value === '' ? null : new Date(value).toISOString();
}

/* ── Stage primitives (hi-fi) ── */

function StageMark({ letter, done }: { letter: string; done?: boolean }) {
  return (
    <span
      className={`flex size-7 shrink-0 items-center justify-center rounded-md border text-[12.5px] font-bold ${
        done ? 'border-accent/30 bg-accent/10 text-accent' : 'border-ink/15 text-ink/70'
      }`}
    >
      {done ? '✓' : letter}
    </span>
  );
}

function StageDone({ letter, title, summary, onEdit }: { letter: string; title: string; summary: string; onEdit?: () => void }) {
  return (
    <ICard className="opacity-80">
      <div className="flex items-center gap-3.5 px-7 py-4">
        <StageMark letter={letter} done />
        <span className="text-[15px] font-semibold">{title}</span>
        <span className="ml-auto truncate text-[13.5px] text-dim">{summary}</span>
        {onEdit && (
          <button type="button" className="shrink-0 text-[13.5px] font-medium text-accent hover:underline" onClick={onEdit}>
            Edit
          </button>
        )}
      </div>
    </ICard>
  );
}

/* ── Page ── */

export function EditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: post, isPending, isError } = useQuery({
    queryKey: ['post', id],
    queryFn: () => fetchPost(id!),
    enabled: id !== undefined,
  });

  const [platform, setPlatform] = useState<Platform>('linkedin');
  const [caption, setCaption] = useState('');
  const [targetLocal, setTargetLocal] = useState('');
  const [guidance, setGuidance] = useState<ReadyMissing | null>(null);
  const [savedFlash, setSavedFlash] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [reopened, setReopened] = useState<{ a: boolean; b: boolean }>({ a: false, b: false });

  useEffect(() => {
    if (post) {
      setPlatform(post.platform);
      setCaption(post.caption);
      setTargetLocal(isoToLocalInput(post.targetDatetime));
    }
  }, [post]);

  function refresh(updated: PostView) {
    queryClient.setQueryData(['post', id], updated);
    void queryClient.invalidateQueries({ queryKey: ['today'] });
  }

  const save = useMutation({
    mutationFn: (input: Parameters<typeof updatePost>[1]) => updatePost(id!, input),
    onSuccess: (updated) => {
      refresh(updated);
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 1500);
    },
  });

  const quickStartMut = useMutation({
    mutationFn: () => quickStart(id!),
    onSuccess: (updated) => refresh(updated),
  });

  const repurposeMut = useMutation({
    mutationFn: (platform: Platform) => repurpose(id!, platform),
    onSuccess: (created) => {
      void queryClient.invalidateQueries({ queryKey: ['today'] });
      navigate(`/posts/${created.id}`); // open the new sibling
    },
  });

  const ready = useMutation({
    mutationFn: async () => {
      await updatePost(id!, {
        platform,
        format: PLATFORM_FORMAT[platform],
        caption,
        ...(post?.capabilities.canEditTarget ? { targetDatetime: localInputToIso(targetLocal) } : {}),
      });
      return markReady(id!);
    },
    onSuccess: (result) => {
      refresh(result.post);
      setGuidance(result.ready ? null : result.missing);
    },
  });

  if (isPending) {
    return (
      <Shell right="Post editor">
        <p className="px-6 pt-12 text-[15px] text-dim">…</p>
      </Shell>
    );
  }
  if (isError || !post) {
    return (
      <Shell right="Post editor">
        <p className="px-6 pt-12 text-[15px] text-dim">Couldn't load this post.</p>
      </Shell>
    );
  }

  // The Result is a STATE inside the editor — never a separate page/route.
  if (post.cardState === 'posted') {
    return (
      <Shell right="Post editor">
        <ResultCard post={post} />
      </Shell>
    );
  }

  const meta = PLATFORM_META[post.platform];
  const isReady = post.readiness === 'ready';
  const isDue = post.cardState === 'due';
  const isMissed = post.cardState === 'missed';
  const canCopy = caption.trim().length > 0;

  const eyebrow: [Parameters<typeof Eyebrow>[0]['tone'], string] = post.dueNotReady
    ? ['accent', 'Due · not ready']
    : isDue
      ? ['accent', 'Due now']
      : isMissed
        ? ['missed', 'Missed · still resolvable']
        : isReady
          ? ['accent', 'Ready']
          : ['dim', 'Draft'];

  const prepareSummary = `${meta.label} · ${meta.formatLabel} · caption ${post.caption.length} chars`;
  const scheduleSummary = post.targetDatetime ? `${formatTargetLine(post.targetDatetime)} · ${READY_CONFIRM}` : '';

  const showPrepareOpen = !isReady || reopened.a;
  const showScheduleOpen = !isReady || reopened.b;

  const flushPrepare = () =>
    save.mutate({ platform, format: PLATFORM_FORMAT[platform], caption });

  return (
    <Shell right="Post editor">
      <main className="mx-auto w-full max-w-[660px] flex-1 px-6 pt-12 pb-10">
        <Eyebrow tone={eyebrow[0]} pulse={isDue || post.dueNotReady}>
          {eyebrow[1]}
        </Eyebrow>
        <h1 className="mt-3 font-serif text-[28px] leading-[1.2]">“{post.ideaTitle}”</h1>
        <p className="mt-2 flex items-center gap-3 text-[14px] text-dim">
          <PlatformBadge name={meta.label} color={meta.color} /> <span>{meta.formatLabel}</span>
          <span>· {EFFORT_LABEL[post.effortScore]}</span>
          {post.targetDatetime && <span className="tabular-nums">· target {formatTargetLine(post.targetDatetime)}</span>}
        </p>

        <div className="mt-8 flex flex-col gap-4">
          {/* A · Prepare */}
          {showPrepareOpen ? (
            <ICard>
              <div className="flex items-center gap-3.5 border-b border-ink/8 px-7 py-4">
                <StageMark letter="A" done={isReady} />
                <span className="text-[15px] font-semibold">Prepare</span>
                <span className="ml-auto text-[12px] font-semibold uppercase tracking-[0.14em] text-dim">
                  {isReady ? 'Editable' : 'In progress'}
                </span>
              </div>
              <div className="flex flex-col gap-5 px-7 py-6">
                <div className="grid grid-cols-2 gap-4">
                  <ISelect
                    label="Platform"
                    value={platform}
                    options={PLATFORM_OPTIONS}
                    disabled={!post.capabilities.canEditPrepare}
                    onChange={(p) => setPlatform(p)}
                  />
                  <ISelect
                    label="Format"
                    value={PLATFORM_FORMAT[platform]}
                    options={[{ value: PLATFORM_FORMAT[platform], label: PLATFORM_META[platform].formatLabel }]}
                    disabled
                  />
                </div>
                <IField
                  label="Caption"
                  textarea
                  value={caption}
                  placeholder={captionPlaceholder(platform)}
                  disabled={!post.capabilities.canEditPrepare}
                  onChange={setCaption}
                  right={<span className="text-[12px] text-dim">{caption.length} characters</span>}
                />
                <div className="flex items-center justify-between">
                  {post.capabilities.canQuickStart && caption.trim() === '' ? (
                    <button
                      type="button"
                      className="text-[13.5px] font-medium text-accent hover:underline disabled:opacity-50"
                      disabled={quickStartMut.isPending}
                      onClick={() => quickStartMut.mutate()}
                      title={QUICK_START_HELPER}
                    >
                      {QUICK_START}
                    </button>
                  ) : (
                    <span />
                  )}
                  <BtnSecondary className="px-6" disabled={save.isPending || !post.capabilities.canEditPrepare} onClick={flushPrepare}>
                    {savedFlash ? 'Saved ✓' : isReady ? 'Save changes' : SAVE_DRAFT}
                  </BtnSecondary>
                </div>
              </div>
            </ICard>
          ) : (
            <StageDone letter="A" title="Prepare" summary={prepareSummary} onEdit={() => setReopened((r) => ({ ...r, a: true }))} />
          )}

          {/* B · Schedule */}
          {showScheduleOpen ? (
            <ICard>
              <div className="flex items-center gap-3.5 border-b border-ink/8 px-7 py-4">
                <StageMark letter="B" done={isReady} />
                <span className="text-[15px] font-semibold">Schedule</span>
              </div>
              <div className="flex flex-col gap-5 px-7 py-6">
                <IField
                  label="Target date & time"
                  type="datetime-local"
                  value={targetLocal}
                  disabled={!post.capabilities.canEditTarget}
                  helper={post.capabilities.canEditTarget ? SCHEDULE_HELPER : 'Locked — the target can no longer move.'}
                  onChange={setTargetLocal}
                  onBlur={() => {
                    if (post.capabilities.canEditTarget) save.mutate({ targetDatetime: localInputToIso(targetLocal) });
                  }}
                />
                {isReady ? (
                  <p className="text-[14px] font-medium text-accent">✓ {READY_CONFIRM}</p>
                ) : (
                  <div className="flex items-center gap-4">
                    <BtnSecondary className="px-6" disabled={ready.isPending} onClick={() => ready.mutate()}>
                      {MARK_READY}
                    </BtnSecondary>
                    {guidance && <p className="text-[13.5px] text-dim">{READY_GUIDANCE[guidance]}</p>}
                  </div>
                )}
              </div>
            </ICard>
          ) : (
            <StageDone letter="B" title="Schedule" summary={scheduleSummary} onEdit={() => setReopened((r) => ({ ...r, b: true }))} />
          )}

          {/* C · Publish */}
          {isReady ? (
            <ICard className={isDue ? 'outline-2 outline-accent/35' : ''}>
              <div className="flex items-center gap-3.5 border-b border-ink/8 px-7 py-4">
                <StageMark letter="C" />
                <span className="text-[15px] font-semibold">Publish</span>
                {isDue ? (
                  <span className="ml-auto flex items-center gap-2">
                    <span className="relative flex size-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-60 motion-reduce:hidden"></span>
                      <span className="relative inline-flex size-2 rounded-full bg-accent"></span>
                    </span>
                    <span className="text-[12px] font-semibold uppercase tracking-[0.14em] text-accent">Due now</span>
                  </span>
                ) : isMissed ? (
                  <span className="ml-auto text-[12px] font-semibold uppercase tracking-[0.14em] text-missed">Missed</span>
                ) : (
                  <span className="ml-auto text-[12px] font-semibold uppercase tracking-[0.14em] text-dim">When it's time</span>
                )}
              </div>
              <div className="flex flex-col gap-4 px-7 py-6">
                {isDue && (
                  <p className="rounded-lg bg-accent/8 px-5 py-3.5 text-[14.5px] leading-relaxed text-ink/85">
                    {dueMessage(post.platform)}
                  </p>
                )}
                {isMissed && (
                  <p className="rounded-lg bg-missed/8 px-5 py-3.5 text-[14.5px] leading-relaxed text-ink/75">{MISSED_MESSAGE}</p>
                )}
                <div className="flex gap-3">
                  <BtnSecondary
                    className="flex-1"
                    disabled={!canCopy}
                    onClick={() => void navigator.clipboard.writeText(caption)}
                  >
                    Copy Caption
                  </BtnSecondary>
                  <BtnSecondary className="flex-1" href={meta.url}>
                    {meta.openLabel}
                  </BtnSecondary>
                </div>
                {isDue ? (
                  <BtnPrimary className="w-full py-3" disabled={!post.capabilities.canMarkPosted} onClick={() => setSheetOpen(true)}>
                    {MARK_POSTED}
                  </BtnPrimary>
                ) : (
                  <BtnSecondary className="w-full" disabled={!post.capabilities.canMarkPosted} onClick={() => setSheetOpen(true)}>
                    {MARK_POSTED}
                  </BtnSecondary>
                )}
              </div>
            </ICard>
          ) : (
            <div className="rounded-xl border border-dashed border-ink/15 px-7 py-4">
              <div className="flex items-center gap-3.5">
                <span className="flex size-7 items-center justify-center rounded-md border border-ink/12 text-[12.5px] font-bold text-ink/35">
                  C
                </span>
                <span className="text-[15px] font-semibold text-ink/40">Publish</span>
                <span className="ml-auto text-[13px] text-ink/35">{PUBLISH_LOCKED}</span>
              </div>
            </div>
          )}
        </div>

        {/* v0.2c (D-37): repurpose this idea to platforms it isn't on yet. (Posted posts return earlier.) */}
        {post.repurposeTargets.length > 0 && (
          <div className="mt-8 rounded-xl border border-ink/10 bg-paper px-7 py-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-dim">{REPURPOSE_HEADING}</p>
            <p className="mt-1.5 text-[13.5px] text-dim">{REPURPOSE_HELPER}</p>
            <div className="mt-3.5 flex flex-wrap gap-2.5">
              {post.repurposeTargets.map((p) => (
                <BtnSecondary
                  key={p}
                  className="text-[13.5px]"
                  disabled={repurposeMut.isPending}
                  onClick={() => repurposeMut.mutate(p)}
                >
                  {repurposeToLabel(PLATFORM_META[p].label)}
                </BtnSecondary>
              ))}
            </div>
          </div>
        )}
      </main>

      {sheetOpen && <MarkPostedSheet post={post} onClose={() => setSheetOpen(false)} />}
    </Shell>
  );
}

function Shell({ right, children }: { right: string; children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-paper font-sans text-ink antialiased">
      <IHeader back="Today" right={right} />
      {children}
    </div>
  );
}
