// The reward moment — hi-fi Result, a state inside the editor. The one motion moment
// (settle + check pop, reduced-motion gated). Late shares the layout; never red.
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { updatePost } from '../api/client';
import type { PostView } from '../api/types';
import { formatDateParts } from '../lib/format';

/** Date over time, always both — "Jun 13" / "10:00 AM". */
function When({ iso }: { iso: string | null }) {
  if (!iso) return <span className="text-ink/40">—</span>;
  const { date, time } = formatDateParts(iso);
  return (
    <span className="block">
      <span className="block text-[12px] text-dim">{date}</span>
      <span className="tabular-nums">{time}</span>
    </span>
  );
}
import { BACK_TO_TODAY, RESULT_TITLE, RESULT_VOICE } from '../lib/microcopy';
import { PLATFORM_META } from '../lib/platform';
import { BtnPrimary, ICard, PlatformBadge, Readout } from './ui';

const FIELD =
  'w-full rounded-lg border border-ink/15 bg-white px-3.5 py-2 text-[14px] text-ink focus:outline-2 focus:outline-accent/60';

export function ResultCard({ post }: { post: PostView }) {
  const queryClient = useQueryClient();
  const [editingTime, setEditingTime] = useState(false);
  const [timeLocal, setTimeLocal] = useState('');
  const [addingLink, setAddingLink] = useState(false);
  const [url, setUrl] = useState('');

  const late = post.adherenceStatus === 'late';
  const verdict: 'on_time' | 'late' = late ? 'late' : 'on_time';
  const meta = PLATFORM_META[post.platform];

  const patch = useMutation({
    mutationFn: (input: { actualDatetime?: string; nativePostUrl?: string }) => updatePost(post.id, input),
    onSuccess: (updated) => {
      queryClient.setQueryData(['post', post.id], updated);
      void queryClient.invalidateQueries({ queryKey: ['today'] });
      setEditingTime(false);
      setAddingLink(false);
    },
  });

  return (
    <main className="mx-auto w-full max-w-[560px] flex-1 px-6 pt-16 pb-12">
      <ICard className="anim-settle">
        <div className="flex flex-col items-center px-10 py-10 text-center">
          <span
            className={`anim-check flex size-14 items-center justify-center rounded-full text-[24px] text-white ${late ? 'bg-late' : 'bg-success'}`}
          >
            ✓
          </span>
          <h1 className="mt-5 font-serif text-[30px] leading-tight">{RESULT_TITLE[verdict]}</h1>
          <p className="mt-2 flex items-center gap-3 text-[14px] text-dim">
            <PlatformBadge name={meta.label} color={meta.color} /> <span>{meta.formatLabel}</span>
          </p>
        </div>

        <Readout
          cells={[
            ['Target', <When key="t" iso={post.targetDatetime} />],
            ['Posted', <When key="a" iso={post.actualDatetime} />],
            ['Result', late ? <span key="r" className="text-late">Late</span> : <span key="r" className="text-success">On-time ✓</span>],
            [
              'Link',
              post.nativePostUrl ? (
                <a key="l" href={post.nativePostUrl} target="_blank" rel="noreferrer" className="text-accent">
                  {post.nativePostUrl.replace(/^https?:\/\/(www\.)?/, '').slice(0, 18)}… ↗
                </a>
              ) : (
                <span key="l" className="text-ink/40">—</span>
              ),
            ],
          ]}
        />

        {/* Quiet corrections row — actual time stays editable (#21); link can be added later. */}
        <div className="flex items-center justify-center gap-5 border-b border-ink/8 px-10 py-2.5">
          <button
            type="button"
            className="text-[12.5px] font-medium text-dim hover:text-ink"
            onClick={() => {
              setEditingTime((v) => !v);
              setAddingLink(false);
            }}
          >
            Edit posted time
          </button>
          {!post.nativePostUrl && (
            <button
              type="button"
              className="text-[12.5px] font-medium text-dim hover:text-ink"
              onClick={() => {
                setAddingLink((v) => !v);
                setEditingTime(false);
              }}
            >
              + Add link
            </button>
          )}
        </div>

        {(editingTime || addingLink) && (
          <div className="flex gap-2.5 border-b border-ink/8 px-10 py-4">
            {editingTime ? (
              <input type="datetime-local" className={FIELD} value={timeLocal} onChange={(e) => setTimeLocal(e.target.value)} />
            ) : (
              <input
                className={FIELD}
                value={url}
                placeholder="https://www.linkedin.com/posts/…"
                onChange={(e) => setUrl(e.target.value)}
              />
            )}
            <button
              type="button"
              className="shrink-0 rounded-lg bg-accent px-5 text-[14px] font-semibold text-white hover:brightness-105 disabled:opacity-40"
              disabled={patch.isPending || (editingTime ? timeLocal === '' : url.trim() === '')}
              onClick={() =>
                patch.mutate(editingTime ? { actualDatetime: new Date(timeLocal).toISOString() } : { nativePostUrl: url.trim() })
              }
            >
              Save
            </button>
          </div>
        )}
        {patch.isError && <p className="px-10 pt-3 text-[13px] text-dim">{patch.error.message}</p>}

        <div className="px-10 py-7 text-center">
          <p className="font-serif text-[17px] italic text-ink/75">“{RESULT_VOICE[verdict]}”</p>
          <BtnPrimary className="mt-6 w-full py-3" to="/">
            {BACK_TO_TODAY}
          </BtnPrimary>
        </div>
      </ICard>
    </main>
  );
}
