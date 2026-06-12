import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { PostView } from '../api/types';
import { MarkPostedSheet } from './MarkPostedSheet';
import { formatTargetLine, formatTime } from '../lib/format';
import {
  COPY_CAPTION_DISABLED_HELPER,
  FORMAT_LABEL,
  MISSED_MESSAGE,
  PLATFORM_LABEL,
  PRIMARY_CTA,
  dueMessage,
} from '../lib/microcopy';
import { PLATFORM_URL } from '../lib/platform';

interface Props {
  post: PostView;
}

/** Renders server-derived state only — no status logic lives here (ADR-3). */
export function TodayCard({ post }: Props) {
  const [copied, setCopied] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const platformLabel = PLATFORM_LABEL[post.platform];
  const canCopy = post.caption.length > 0;

  function copyCaption() {
    navigator.clipboard
      .writeText(post.caption)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      })
      .catch(() => {
        // Clipboard unavailable: quiet fallback — select-and-copy comes with the editor (M3).
        window.prompt('Copy the caption:', post.caption);
      });
  }

  const statusLabel: Record<PostView['postingStatus'], string> = {
    planned: 'Planned',
    due: 'Due',
    posted: 'Posted',
    missed: 'Missed',
  };

  return (
    <section className="card">
      <h2 className="card-title">“{post.ideaTitle}”</h2>
      <div className="card-meta">
        <span className="chip">in {platformLabel}</span>
        <span className="chip">{FORMAT_LABEL[post.format] ?? post.format}</span>
        {post.targetDatetime && <span className="target">⌖ Target {formatTargetLine(post.targetDatetime)}</span>}
      </div>

      <div className="status-row">
        <span className="status-group">
          <span className="label">Readiness</span>
          <span className={`chip ${post.readiness === 'ready' ? 'chip-fill' : ''}`}>
            {post.readiness === 'ready' ? 'Ready' : 'Draft'}
          </span>
        </span>
        <span className="status-group">
          <span className="label">Status</span>
          <span className={`chip ${post.cardState === 'posted' ? 'chip-fill' : ''}`}>
            {statusLabel[post.postingStatus]}
          </span>
        </span>
        {post.cardState === 'posted' && (
          <span className="status-group">
            <span className="label">Result</span>
            <span className="chip chip-fill">
              ✓ {post.adherenceStatus === 'on_time' ? 'On-time' : post.adherenceStatus === 'late' ? 'Late' : '—'}
            </span>
          </span>
        )}
      </div>

      {post.cardState === 'due' && <div className="card-msg card-msg-due">{dueMessage(post.platform)}</div>}
      {post.cardState === 'missed' && <div className="card-msg card-msg-missed">{MISSED_MESSAGE}</div>}
      {post.cardState === 'posted' && post.actualDatetime && post.targetDatetime && (
        <div className="posted-line">
          Posted {formatTime(post.actualDatetime)} · target {formatTime(post.targetDatetime)} ·{' '}
          {post.adherenceStatus === 'on_time'
            ? `within the ${post.graceWindowMinutes}-min window`
            : `past the ${post.graceWindowMinutes}-min window`}
        </div>
      )}

      <hr className="divider" />

      <div className="inline-actions">
        <div className="inline-col">
          <button type="button" className="btn" disabled={!canCopy} onClick={copyCaption}>
            ⧉ {copied ? 'Copied' : 'Copy Caption'}
          </button>
          {!canCopy && <div className="help">{COPY_CAPTION_DISABLED_HELPER}</div>}
        </div>
        <a className="btn btn-link" href={PLATFORM_URL[post.platform]} target="_blank" rel="noreferrer">
          ↗ Open {platformLabel}
        </a>
      </div>

      {/* Primary CTA — state-driven (frozen CTA table). Resolve item lands in M5. */}
      {post.cardState === 'due' ? (
        <button
          type="button"
          className="btn btn-primary"
          disabled={!post.capabilities.canMarkPosted}
          onClick={() => setSheetOpen(true)}
        >
          {PRIMARY_CTA.due}
        </button>
      ) : post.cardState === 'missed' ? (
        <button type="button" className="btn btn-primary" disabled title="Resolve item arrives in M5">
          {PRIMARY_CTA.missed}
        </button>
      ) : (
        <Link to={`/posts/${post.id}`} className="btn btn-primary">
          {PRIMARY_CTA[post.cardState]}
        </Link>
      )}

      {sheetOpen && <MarkPostedSheet post={post} onClose={() => setSheetOpen(false)} />}
    </section>
  );
}
