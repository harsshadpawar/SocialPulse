import { useQuery } from '@tanstack/react-query';
import { fetchToday } from '../api/client';
import { TodayCard } from '../components/TodayCard';
import { BtnPrimary, Command, Eyebrow, ICard, IHeader } from '../components/ui';
import { EMPTY_CARD_BODY, EMPTY_CTA, commandFor, commandSub, eyebrowFor } from '../lib/microcopy';

/**
 * The command surface. Refetch on window focus + 30s interval IS the v0.1 reminder
 * (decision #19): reopen the laptop → React Query refetches → server re-derives → Due appears.
 */
export function TodayPage() {
  const { data, isPending, isError } = useQuery({
    queryKey: ['today'],
    queryFn: fetchToday,
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
  });

  return (
    <div className="flex min-h-screen flex-col bg-paper font-sans text-ink antialiased">
      <IHeader />
      <main className="mx-auto w-full max-w-[660px] flex-1 px-6 pt-14 pb-12">
        {isPending && <p className="text-[15px] text-dim">…</p>}
        {isError && <p className="text-[15px] text-dim">Can't reach the API — is `npm run dev` running?</p>}

        {data && (
          <>
            {(() => {
              const [tone, label] = eyebrowFor(data.state, data.post?.adherenceStatus);
              return (
                <Eyebrow tone={tone} pulse={data.state === 'due'}>
                  {label}
                </Eyebrow>
              );
            })()}
            <Command sub={commandSub(data.state, data.post?.platform)}>
              {commandFor(data.state, data.post?.platform)}
            </Command>

            {data.post ? (
              <TodayCard post={data.post} />
            ) : (
              <ICard className="mt-9">
                <div className="flex flex-col items-center gap-4 px-8 py-14 text-center">
                  <span className="flex size-11 items-center justify-center rounded-full border border-ink/12 text-[18px] text-dim">
                    ＋
                  </span>
                  <p className="max-w-[40ch] text-[15px] leading-relaxed text-dim">{EMPTY_CARD_BODY}</p>
                  <BtnPrimary className="mt-1 px-8" to="/ideas/new">
                    {EMPTY_CTA}
                  </BtnPrimary>
                </div>
              </ICard>
            )}

            {data.plannedTodayCount > 0 && data.post && (
              <p className="mt-5 text-center text-[13px] text-dim">
                {Math.min(data.postedTodayCount + (data.post.postingStatus === 'posted' ? 0 : 1), data.plannedTodayCount)} of{' '}
                {data.plannedTodayCount} planned today
              </p>
            )}
          </>
        )}
      </main>
    </div>
  );
}
