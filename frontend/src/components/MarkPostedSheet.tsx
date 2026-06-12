// The Mark Posted ritual (brief §7) — a small ceremony, not a database update.
// Actual time prefills with "now" and stays editable; skipping the link is first-class, no guilt.
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { markPosted } from '../api/client';
import type { PostView } from '../api/types';
import { SAVE_RESULT, SHEET_TIME_LABEL, SHEET_TITLE, SHEET_URL_LABEL, SKIP_LINK } from '../lib/microcopy';

function nowLocalInput(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

interface Props {
  post: PostView;
  onClose: () => void;
}

export function MarkPostedSheet({ post, onClose }: Props) {
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
    <div className="sheet-backdrop" role="dialog" aria-modal="true" aria-label={SHEET_TITLE}>
      <div className="sheet">
        <h2 className="sheet-title">{SHEET_TITLE}</h2>

        <label className="field">
          <span className="label">{SHEET_URL_LABEL}</span>
          <input
            className="input"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.linkedin.com/posts/…"
            inputMode="url"
          />
        </label>

        <label className="field">
          <span className="label">{SHEET_TIME_LABEL}</span>
          <input
            type="datetime-local"
            className="input"
            value={timeLocal}
            onChange={(e) => setTimeLocal(e.target.value)}
          />
        </label>

        <button
          type="button"
          className="btn btn-primary"
          disabled={submit.isPending}
          onClick={() => submit.mutate(true)}
        >
          {SAVE_RESULT}
        </button>
        <button
          type="button"
          className="btn btn-ghost"
          disabled={submit.isPending}
          onClick={() => submit.mutate(false)}
        >
          {SKIP_LINK}
        </button>
        {submit.isError && <p className="help">{submit.error.message}</p>}
      </div>
    </div>
  );
}
