// The reward moment — the editor itself transforms; no navigation, no separate page.
// On-time and Late share the layout and the ✓; only the chip and voice line differ. Late is never red.
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { updatePost } from '../api/client';
import type { PostView } from '../api/types';
import { formatTime } from '../lib/format';
import { BACK_TO_TODAY, FORMAT_LABEL, PLATFORM_LABEL, RESULT_TITLE, RESULT_VOICE } from '../lib/microcopy';

interface Props {
  post: PostView;
}

export function ResultCard({ post }: Props) {
  const queryClient = useQueryClient();
  const [editingTime, setEditingTime] = useState(false);
  const [timeLocal, setTimeLocal] = useState('');
  const [addingLink, setAddingLink] = useState(false);
  const [url, setUrl] = useState('');

  const verdict: 'on_time' | 'late' = post.adherenceStatus === 'late' ? 'late' : 'on_time';

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
    <section className="result settle">
      <div className="result-mark">✓</div>
      <h1 className="result-title">{RESULT_TITLE[verdict]}</h1>
      <div className="card-meta result-chips">
        <span className="chip">in {PLATFORM_LABEL[post.platform]}</span>
        <span className="chip">{FORMAT_LABEL[post.format] ?? post.format}</span>
      </div>

      <div className="result-rows">
        <div className="result-row">
          <span className="label">Target</span>
          <span>{post.targetDatetime ? formatTime(post.targetDatetime) : '—'}</span>
        </div>
        <div className="result-row">
          <span className="label">Posted</span>
          <span>
            {post.actualDatetime ? formatTime(post.actualDatetime) : '—'}{' '}
            <button type="button" className="link-btn" onClick={() => setEditingTime((v) => !v)}>
              edit
            </button>
          </span>
        </div>
        <div className="result-row">
          <span className="label">Result</span>
          <span className={`chip ${verdict === 'on_time' ? 'chip-fill' : 'chip-late'}`}>
            {verdict === 'on_time' ? 'On-time' : 'Late'}
          </span>
        </div>
        {post.nativePostUrl ? (
          <div className="result-row">
            <span className="label">Link</span>
            <a href={post.nativePostUrl} target="_blank" rel="noreferrer" className="result-link">
              {post.nativePostUrl.replace(/^https?:\/\/(www\.)?/, '').slice(0, 34)}… ↗
            </a>
          </div>
        ) : (
          <div className="result-row">
            <span className="label">Link</span>
            <button type="button" className="link-btn" onClick={() => setAddingLink((v) => !v)}>
              + add link
            </button>
          </div>
        )}
      </div>

      {editingTime && (
        <div className="result-edit">
          <input
            type="datetime-local"
            className="input"
            value={timeLocal}
            onChange={(e) => setTimeLocal(e.target.value)}
          />
          <button
            type="button"
            className="btn"
            disabled={timeLocal === '' || patch.isPending}
            onClick={() => patch.mutate({ actualDatetime: new Date(timeLocal).toISOString() })}
          >
            Save
          </button>
        </div>
      )}

      {addingLink && (
        <div className="result-edit">
          <input
            className="input"
            value={url}
            placeholder="https://www.linkedin.com/posts/…"
            onChange={(e) => setUrl(e.target.value)}
          />
          <button
            type="button"
            className="btn"
            disabled={url.trim() === '' || patch.isPending}
            onClick={() => patch.mutate({ nativePostUrl: url.trim() })}
          >
            Save
          </button>
        </div>
      )}
      {patch.isError && <p className="help">{patch.error.message}</p>}

      <p className="result-voice">“{RESULT_VOICE[verdict]}”</p>

      <Link to="/" className="btn btn-primary">
        {BACK_TO_TODAY}
      </Link>
    </section>
  );
}
