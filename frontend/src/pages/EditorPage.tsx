import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { fetchPost, markReady, updatePost } from '../api/client';
import { MarkPostedSheet } from '../components/MarkPostedSheet';
import { ResultCard } from '../components/ResultCard';
import type { Format, Platform, PostView, ReadyMissing } from '../api/types';
import {
  FORMAT_LABEL,
  MARK_POSTED,
  MARK_READY,
  MISSED_MESSAGE,
  PLATFORM_LABEL,
  READY_CONFIRM,
  READY_GUIDANCE,
  SAVE_DRAFT,
  TARGET_LOCKED_NOTE,
  TARGET_PLACEHOLDER,
  captionPlaceholder,
  dueMessage,
} from '../lib/microcopy';
import { PLATFORM_URL } from '../lib/platform';

/** v0.1 fixed pairs (decision #12) — selecting a platform selects its format. */
const PLATFORM_FORMAT: Record<Platform, Format> = {
  linkedin: 'text_post',
  x: 'short_post',
  youtube: 'short_video',
  instagram: 'reel',
};

/** ISO ↔ datetime-local (browser tz — Dubai for v0.1, documented assumption). */
function isoToLocalInput(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function localInputToIso(value: string): string | null {
  return value === '' ? null : new Date(value).toISOString();
}

export function EditorPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const { data: post, isPending, isError } = useQuery({
    queryKey: ['post', id],
    queryFn: () => fetchPost(id!),
    enabled: id !== undefined,
  });

  // Local form state, synced from server snapshots.
  const [platform, setPlatform] = useState<Platform>('linkedin');
  const [caption, setCaption] = useState('');
  const [targetLocal, setTargetLocal] = useState('');
  const [guidance, setGuidance] = useState<ReadyMissing | null>(null);
  const [savedFlash, setSavedFlash] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

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

  const ready = useMutation({
    mutationFn: async () => {
      // Flush pending edits first so the gate judges what the user sees.
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

  if (isPending) return <Shell><p className="quiet">…</p></Shell>;
  if (isError || !post) return <Shell><p className="quiet">Couldn't load this post.</p></Shell>;

  const isReady = post.readiness === 'ready';
  const isDue = post.cardState === 'due';
  const isPosted = post.cardState === 'posted';
  const canCopy = caption.trim().length > 0;

  // The Result is a STATE inside the editor — never a separate page/route.
  if (isPosted) {
    return (
      <Shell>
        <ResultCard post={post} />
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="idea-context">
        <span className="label">From idea</span>
        <div>
          “{post.ideaTitle}” · {PLATFORM_LABEL[post.platform]} · {FORMAT_LABEL[post.format] ?? post.format}
        </div>
      </div>

      {/* A · Prepare */}
      <section className={`stage ${isReady ? 'stage-done' : ''}`}>
        <div className="stage-head">
          <span className="stage-n">A</span>
          <span className="stage-title">Prepare</span>
          <span className="label stage-state">{isReady ? 'done ✓' : 'in progress'}</span>
        </div>
        <div className="two-col">
          <label className="field">
            <span className="label">Platform</span>
            <select
              className="input"
              value={platform}
              disabled={!post.capabilities.canEditPrepare}
              onChange={(e) => setPlatform(e.target.value as Platform)}
            >
              {(Object.keys(PLATFORM_LABEL) as Platform[]).map((p) => (
                <option key={p} value={p}>{PLATFORM_LABEL[p]}</option>
              ))}
            </select>
          </label>
          <label className="field">
            <span className="label">Format</span>
            <select className="input" value={PLATFORM_FORMAT[platform]} disabled>
              <option value={PLATFORM_FORMAT[platform]}>{FORMAT_LABEL[PLATFORM_FORMAT[platform]]}</option>
            </select>
          </label>
        </div>
        <label className="field">
          <span className="label">Caption</span>
          <textarea
            className="input input-tall"
            value={caption}
            disabled={!post.capabilities.canEditPrepare}
            placeholder={captionPlaceholder(platform)}
            onChange={(e) => setCaption(e.target.value)}
          />
        </label>
        {!isReady && post.capabilities.canEditPrepare && (
          <button
            type="button"
            className="btn"
            disabled={save.isPending}
            onClick={() => save.mutate({ platform, format: PLATFORM_FORMAT[platform], caption })}
          >
            {savedFlash ? 'Saved ✓' : SAVE_DRAFT}
          </button>
        )}
        {isReady && post.capabilities.canEditPrepare && (
          <button
            type="button"
            className="btn"
            disabled={save.isPending}
            onClick={() => save.mutate({ platform, format: PLATFORM_FORMAT[platform], caption })}
          >
            {savedFlash ? 'Saved ✓' : 'Save changes'}
          </button>
        )}
      </section>

      {/* B · Schedule */}
      <section className={`stage ${isReady ? 'stage-done' : ''}`}>
        <div className="stage-head">
          <span className="stage-n">B</span>
          <span className="stage-title">Schedule</span>
          <span className="label stage-state">{isReady ? 'done ✓' : ''}</span>
        </div>
        <label className="field">
          <span className="label">Target date &amp; time</span>
          <input
            type="datetime-local"
            className="input"
            value={targetLocal}
            disabled={!post.capabilities.canEditTarget}
            placeholder={TARGET_PLACEHOLDER}
            onChange={(e) => setTargetLocal(e.target.value)}
            onBlur={() => {
              if (post.capabilities.canEditTarget) {
                save.mutate({ targetDatetime: localInputToIso(targetLocal) });
              }
            }}
          />
        </label>
        {!post.capabilities.canEditTarget && !isPosted && <div className="help">{TARGET_LOCKED_NOTE}</div>}
        {isReady ? (
          <div className="ready-line">✓ {READY_CONFIRM}</div>
        ) : (
          <div className="inline-col">
            <button type="button" className="btn" disabled={ready.isPending} onClick={() => ready.mutate()}>
              {MARK_READY}
            </button>
            {guidance && <div className="help">{READY_GUIDANCE[guidance]}</div>}
          </div>
        )}
      </section>

      {/* C · Publish */}
      {isReady ? (
        <section className={`stage ${isDue ? 'stage-due' : ''}`}>
          <div className="stage-head">
            <span className="stage-n">C</span>
            <span className="stage-title">Publish</span>
            <span className="label stage-state">{isDue ? 'due now' : "when it's time"}</span>
          </div>
          {isDue && <div className="card-msg card-msg-due">{dueMessage(post.platform)}</div>}
          {post.cardState === 'missed' && <div className="card-msg card-msg-missed">{MISSED_MESSAGE}</div>}
          <div className="inline-actions">
            <button
              type="button"
              className="btn"
              disabled={!canCopy}
              onClick={() => void navigator.clipboard.writeText(caption)}
            >
              ⧉ Copy Caption
            </button>
            <a className="btn btn-link" href={PLATFORM_URL[post.platform]} target="_blank" rel="noreferrer">
              ↗ Open {PLATFORM_LABEL[post.platform]}
            </a>
          </div>
          <button
            type="button"
            className={isDue ? 'btn btn-primary' : 'btn'}
            disabled={!post.capabilities.canMarkPosted}
            onClick={() => setSheetOpen(true)}
            style={{ width: '100%' }}
          >
            {MARK_POSTED}
          </button>
        </section>
      ) : (
        <section className="stage stage-locked">
          <div className="stage-head">
            <span className="stage-n">C</span>
            <span className="stage-title">Publish</span>
            <span className="label stage-state">appears when Ready</span>
          </div>
          <p className="quiet">Copy Caption · Open {PLATFORM_LABEL[post.platform]} · Mark Posted</p>
        </section>
      )}

      {sheetOpen && <MarkPostedSheet post={post} onClose={() => setSheetOpen(false)} />}
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="shell">
      <header className="header">
        <Link to="/" className="back-link">← Today</Link>
        <span className="header-date">Post Editor</span>
      </header>
      {children}
    </main>
  );
}
