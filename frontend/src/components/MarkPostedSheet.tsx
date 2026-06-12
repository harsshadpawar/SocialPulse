// The Mark Posted ritual (brief §7) — hi-fi sheet. Actual time prefills with "now"
// and stays editable; skipping the link is first-class, no guilt.
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { markPosted } from '../api/client';
import type { PostView } from '../api/types';
import {
  SAVE_RESULT,
  SHEET_EYEBROW,
  SHEET_TIME_HELPER,
  SHEET_TIME_LABEL,
  SHEET_TITLE,
  SHEET_URL_LABEL,
  SKIP_LINK,
} from '../lib/microcopy';
import { BtnGhost, BtnPrimary } from './ui';

function nowLocalInput(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const FIELD =
  'mt-1.5 w-full rounded-lg border border-ink/15 bg-white px-3.5 py-2.5 text-[15px] text-ink placeholder:text-ink/35 focus:outline-2 focus:outline-accent/60';

export function MarkPostedSheet({ post, onClose }: { post: PostView; onClose: () => void }) {
  const [url, setUrl] = useState('');
  const [timeLocal, setTimeLocal] = useState(nowLocalInput); // captured when the sheet opens
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const submit = useMutation({
    mutationFn: (withUrl: boolean) =>
      markPosted(post.id, {
        actualDatetime: new Date(timeLocal).toISOString(),
        ...(withUrl && url.trim() !== '' ? { nativePostUrl: url.trim() } : {}),
      }),
    onSuccess: (updated) => {
      queryClient.setQueryData(['post', post.id], updated);
      void queryClient.invalidateQueries({ queryKey: ['today'] });
      onClose();
      navigate(`/posts/${post.id}`); // the editor transforms into the Result state
    },
  });

  return (
    <div
      className="fixed inset-0 z-10 flex items-center justify-center bg-ink/25 p-5 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-label={SHEET_TITLE}
    >
      <div className="w-[460px] rounded-2xl bg-white p-8 shadow-[0_8px_40px_rgba(40,35,25,0.18)]">
        <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-success">{SHEET_EYEBROW}</p>
        <h2 className="mt-2 font-serif text-[26px] leading-tight">{SHEET_TITLE}</h2>

        <div className="mt-6 flex flex-col gap-5">
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-[0.14em] text-dim">{SHEET_URL_LABEL}</label>
            <input
              className={FIELD}
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.linkedin.com/posts/…"
              inputMode="url"
            />
          </div>
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-[0.14em] text-dim">{SHEET_TIME_LABEL}</label>
            <input type="datetime-local" className={FIELD} value={timeLocal} onChange={(e) => setTimeLocal(e.target.value)} />
            <p className="mt-1.5 text-[13px] text-dim">{SHEET_TIME_HELPER}</p>
          </div>
        </div>

        <div className="mt-7 flex flex-col gap-2">
          <BtnPrimary className="w-full py-3" disabled={submit.isPending} onClick={() => submit.mutate(true)}>
            {SAVE_RESULT}
          </BtnPrimary>
          <BtnGhost className="w-full" disabled={submit.isPending} onClick={() => submit.mutate(false)}>
            {SKIP_LINK}
          </BtnGhost>
        </div>
        {submit.isError && <p className="mt-3 text-[13.5px] text-dim">{submit.error.message}</p>}
      </div>
    </div>
  );
}
