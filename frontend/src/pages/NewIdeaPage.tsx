import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createIdea } from '../api/client';
import { BtnPrimary, Command, Eyebrow, ICard, IField, IHeader } from '../components/ui';
import { NEW_IDEA_CTA, NEW_IDEA_EYEBROW, NEW_IDEA_HEADING, NEW_IDEA_SUB } from '../lib/microcopy';

/** Capture, don't organize. Two fields, one button, <30 seconds. */
export function NewIdeaPage() {
  const [title, setTitle] = useState('');
  const [coreMessage, setCoreMessage] = useState('');
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const create = useMutation({
    mutationFn: (v: { title: string; coreMessage: string; toEditor: boolean }) =>
      createIdea({ title: v.title, coreMessage: v.coreMessage }),
    onSuccess: (post, v) => {
      void queryClient.invalidateQueries({ queryKey: ['today'] });
      navigate(v.toEditor ? `/posts/${post.id}` : `/posts/${post.id}/plan-week`);
    },
  });

  const incomplete = title.trim() === '' || coreMessage.trim() === '';
  const submit = (toEditor: boolean) => {
    if (!incomplete) create.mutate({ title: title.trim(), coreMessage: coreMessage.trim(), toEditor });
  };

  return (
    <div className="flex min-h-screen flex-col bg-paper font-sans text-ink antialiased">
      <IHeader back="Today" right="New idea" />
      <main className="mx-auto w-full max-w-[620px] flex-1 px-6 pt-14 pb-12">
        <Eyebrow tone="dim">{NEW_IDEA_EYEBROW}</Eyebrow>
        <Command sub={NEW_IDEA_SUB}>{NEW_IDEA_HEADING}</Command>

        <ICard className="mt-9">
          <form
            className="flex flex-col gap-6 px-8 py-7"
            onSubmit={(e) => {
              e.preventDefault();
              submit(false);
            }}
          >
            <IField label="Title" value={title} onChange={setTitle} placeholder="“AI credit scoring must be explainable”" />
            <IField
              label="Core message"
              textarea
              value={coreMessage}
              onChange={setCoreMessage}
              placeholder="Banks adopting AI scoring owe customers a reason, not a verdict."
            />
            <BtnPrimary className="w-full py-3" type="submit" disabled={incomplete || create.isPending}>
              {create.isPending ? '…' : NEW_IDEA_CTA}
            </BtnPrimary>
            {create.isError && <p className="text-[13.5px] text-dim">{create.error.message}</p>}
          </form>
        </ICard>
        <p className="mt-4 text-center text-[13.5px] text-dim">
          or{' '}
          <button
            type="button"
            disabled={incomplete || create.isPending}
            onClick={() => submit(true)}
            className="font-medium text-ink underline decoration-ink/30 underline-offset-4 hover:decoration-ink disabled:text-dim disabled:no-underline"
          >
            just write the post
          </button>
        </p>
      </main>
    </div>
  );
}
