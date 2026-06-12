import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createIdea } from '../api/client';
import { NEW_IDEA_CTA, NEW_IDEA_HEADING, NEW_IDEA_LABEL } from '../lib/microcopy';

/** Capture, don't organize. Two fields, one button, <30 seconds. */
export function NewIdeaPage() {
  const [title, setTitle] = useState('');
  const [coreMessage, setCoreMessage] = useState('');
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const create = useMutation({
    mutationFn: createIdea,
    onSuccess: (post) => {
      void queryClient.invalidateQueries({ queryKey: ['today'] });
      navigate(`/posts/${post.id}`);
    },
  });

  const incomplete = title.trim() === '' || coreMessage.trim() === '';

  return (
    <main className="shell">
      <header className="header">
        <Link to="/" className="back-link">← Today</Link>
        <span className="header-date">New Idea</span>
      </header>

      <div className="command">
        <span className="label">{NEW_IDEA_LABEL}</span>
        <h1 className="command-text">{NEW_IDEA_HEADING}</h1>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!incomplete) create.mutate({ title: title.trim(), coreMessage: coreMessage.trim() });
        }}
      >
        <label className="field">
          <span className="label">Title</span>
          <input
            className="input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="“AI credit scoring must be explainable”"
            autoFocus
          />
        </label>

        <label className="field">
          <span className="label">Core message</span>
          <textarea
            className="input input-tall"
            value={coreMessage}
            onChange={(e) => setCoreMessage(e.target.value)}
            placeholder="Banks adopting AI scoring owe customers a reason, not a verdict."
          />
        </label>

        <button type="submit" className="btn btn-primary" disabled={incomplete || create.isPending}>
          {create.isPending ? '…' : NEW_IDEA_CTA}
        </button>
        {create.isError && <p className="help">{create.error.message}</p>}
      </form>
    </main>
  );
}
