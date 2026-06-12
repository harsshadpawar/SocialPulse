import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { fetchPost } from '../api/client';
import { FORMAT_LABEL, PLATFORM_LABEL } from '../lib/microcopy';

/**
 * Post Editor — staged mini-workflow (Prepare → Schedule → Publish), never a flat CRUD form.
 * M2: shell with idea context + stage skeletons. M3 makes Prepare/Schedule work;
 * M4 brings Publish + the Mark Posted ritual + Result state.
 */
export function EditorPage() {
  const { id } = useParams<{ id: string }>();
  const { data: post, isPending, isError } = useQuery({
    queryKey: ['post', id],
    queryFn: () => fetchPost(id!),
    enabled: id !== undefined,
  });

  return (
    <main className="shell">
      <header className="header">
        <Link to="/" className="back-link">← Today</Link>
        <span className="header-date">Post Editor</span>
      </header>

      {isPending && <p className="quiet">…</p>}
      {isError && <p className="quiet">Couldn't load this post.</p>}

      {post && (
        <>
          <div className="idea-context">
            <span className="label">From idea</span>
            <div>
              “{post.ideaTitle}” · {PLATFORM_LABEL[post.platform]} · {FORMAT_LABEL[post.format] ?? post.format}
            </div>
          </div>

          <section className="stage">
            <div className="stage-head">
              <span className="stage-n">A</span>
              <span className="stage-title">Prepare</span>
              <span className="label stage-state">arrives in M3</span>
            </div>
            <p className="quiet">Platform · Format · Caption — editable in the next slice.</p>
          </section>

          <section className="stage">
            <div className="stage-head">
              <span className="stage-n">B</span>
              <span className="stage-title">Schedule</span>
              <span className="label stage-state">arrives in M3</span>
            </div>
            <p className="quiet">Target date &amp; time · Mark Ready.</p>
          </section>

          <section className="stage stage-locked">
            <div className="stage-head">
              <span className="stage-n">C</span>
              <span className="stage-title">Publish</span>
              <span className="label stage-state">appears when Ready</span>
            </div>
            <p className="quiet">Copy Caption · Open {PLATFORM_LABEL[post.platform]} · Mark Posted</p>
          </section>
        </>
      )}
    </main>
  );
}
