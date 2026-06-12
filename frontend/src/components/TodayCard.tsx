// Today's ONE card — hi-fi "Instrument" port (hifi/hifi-today.jsx).
// Renders server-derived state only; no status logic lives here (ADR-3).
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { keepAsMissed } from '../api/client';
import type { PostView } from '../api/types';
import { formatWhen } from '../lib/format';
import {
  COPY_CAPTION_DISABLED_HELPER,
  MISSED_MESSAGE,
  PRIMARY_CTA,
  RESOLVE_KEEP_MISSED,
  RESOLVE_LABEL,
  RESOLVE_MARK_POSTED,
  RESOLVE_MARK_POSTED_NOTE,
  dueMessage,
} from '../lib/microcopy';
import { PLATFORM_META } from '../lib/platform';
import { BtnPrimary, BtnSecondary, ICard, PlatformBadge, Readout, StatusPill } from './ui';
import { MarkPostedSheet } from './MarkPostedSheet';

export function TodayCard({ post }: { post: PostView }) {
  const [copied, setCopied] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const queryClient = useQueryClient();
  const meta = PLATFORM_META[post.platform];
  const canCopy = post.caption.trim().length > 0;
  const state = post.cardState;

  const keepMissed = useMutation({
    mutationFn: () => keepAsMissed(post.id),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['today'] }),
  });

  function copyCaption() {
    navigator.clipboard
      .writeText(post.caption)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      })
      .catch(() => window.prompt('Copy the caption:', post.caption));
  }

  const target = post.targetDatetime ? (
    <span className="tabular-nums">{formatWhen(post.targetDatetime)}</span>
  ) : (
    <span className="text-ink/40">—</span>
  );

  const readinessCell =
    post.readiness === 'ready' ? <span className="text-accent">Ready ✓</span> : <span className="text-ink/60">Draft</span>;

  const statusCell = {
    planned: <span className="text-ink/60">Planned</span>,
    due: <span className="text-accent">Due</span>,
    posted: <span className="text-success">Posted</span>,
    missed: <span className="text-missed">Missed</span>,
  }[post.postingStatus];

  return (
    <>
      <ICard className="mt-9">
        <div className="flex items-start justify-between gap-6 px-8 pt-7 pb-6">
          <h2 className="text-[19px] font-semibold leading-snug">“{post.ideaTitle}”</h2>
          {state === 'posted' && (
            <StatusPill tone={post.adherenceStatus === 'late' ? 'late' : 'success'}>
              {post.adherenceStatus === 'late' ? 'Late' : '✓ On-time'}
            </StatusPill>
          )}
          {state === 'missed' && <StatusPill tone="missed">Missed</StatusPill>}
        </div>

        {state === 'posted' ? (
          <Readout
            cells={[
              ['Platform', <PlatformBadge key="p" name={meta.label} color={meta.color} />],
              ['Target', target],
              ['Posted', <span key="a" className="tabular-nums">{post.actualDatetime ? formatWhen(post.actualDatetime) : '—'}</span>],
              [
                'Result',
                post.adherenceStatus === 'late' ? (
                  <span key="r" className="text-late">Late</span>
                ) : (
                  <span key="r" className="text-success">On-time ✓</span>
                ),
              ],
            ]}
          />
        ) : (
          <Readout
            cells={[
              ['Platform', <PlatformBadge key="p" name={meta.label} color={meta.color} />],
              ['Format', <span key="f">{meta.formatLabel}</span>],
              ['Target', target],
              state === 'draft' || state === 'planned_ready' ? ['Readiness', readinessCell] : ['Status', statusCell],
            ]}
          />
        )}

        {state === 'due' && (
          <p className="mx-8 mt-5 rounded-lg bg-accent/8 px-5 py-3.5 text-[14.5px] leading-relaxed text-ink/85">
            {dueMessage(post.platform)}
          </p>
        )}
        {state === 'missed' && (
          <p className="mx-8 mt-5 rounded-lg bg-missed/8 px-5 py-3.5 text-[14.5px] leading-relaxed text-ink/75">
            {MISSED_MESSAGE}
          </p>
        )}

        {state === 'missed' ? (
          <div className="px-8 py-5">
            <div className="flex gap-3">
              <BtnSecondary className="flex-1" disabled={!canCopy} onClick={copyCaption}>
                {copied ? 'Copied ✓' : 'Copy Caption'}
              </BtnSecondary>
              <BtnSecondary className="flex-1" href={meta.url}>
                {meta.openLabel}
              </BtnSecondary>
            </div>
            <div className="mt-4 rounded-lg border border-ink/10 bg-paper p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-dim">{RESOLVE_LABEL}</p>
              <div className="mt-3 flex gap-3">
                <BtnPrimary
                  className="flex-1"
                  disabled={!post.capabilities.canMarkPosted}
                  title={post.capabilities.canMarkPosted ? undefined : 'Mark this post Ready first'}
                  onClick={() => setSheetOpen(true)}
                >
                  {RESOLVE_MARK_POSTED} <span className="font-normal opacity-80">{RESOLVE_MARK_POSTED_NOTE}</span>
                </BtnPrimary>
                <BtnSecondary className="flex-1" disabled={keepMissed.isPending} onClick={() => keepMissed.mutate()}>
                  {RESOLVE_KEEP_MISSED}
                </BtnSecondary>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-3 px-8 py-5">
            <div className="flex flex-1 flex-col">
              <BtnSecondary disabled={!canCopy} className="w-full" onClick={copyCaption}>
                {copied ? 'Copied ✓' : 'Copy Caption'}
              </BtnSecondary>
              {!canCopy && <p className="mt-1.5 text-center text-[12.5px] text-dim">{COPY_CAPTION_DISABLED_HELPER}</p>}
            </div>
            <BtnSecondary className="flex-1" href={meta.url}>
              {meta.openLabel}
            </BtnSecondary>
            {state === 'due' ? (
              <BtnPrimary className="flex-[1.4]" disabled={!post.capabilities.canMarkPosted} onClick={() => setSheetOpen(true)}>
                {PRIMARY_CTA.due}
              </BtnPrimary>
            ) : (
              <BtnPrimary className="flex-[1.4]" to={`/posts/${post.id}`}>
                {PRIMARY_CTA[state]}
              </BtnPrimary>
            )}
          </div>
        )}
      </ICard>

      {sheetOpen && <MarkPostedSheet post={post} onClose={() => setSheetOpen(false)} />}
    </>
  );
}
