import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { fetchToday } from '../api/client';
import { NavHeader } from '../components/NavHeader';
import { TargetsStrip } from '../components/TargetsStrip';
import { TodayCard } from '../components/TodayCard';
import { BtnPrimary, Command, Eyebrow, ICard } from '../components/ui';
import {
  EMPTY_CARD_BODY,
  EMPTY_CTA,
  REVIEW_THIS_WEEK,
  WORK_DONE_COMMAND,
  WORK_DONE_EYEBROW,
  commandFor,
  commandSub,
  eyebrowFor,
  weeklyEffortLine,
  workDoneSub,
} from '../lib/microcopy';

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

  const ctx = data?.post
    ? {
        platform: data.post.platform,
        format: data.post.format,
        draftSubState: data.post.draftSubState,
        dueNotReady: data.post.dueNotReady,
      }
    : undefined;

  return (
    <div className="flex min-h-screen flex-col bg-paper font-sans text-ink antialiased">
      <NavHeader
        active="today"
        right={
          <Link to="/ideas/new" className="text-[14px] font-medium text-dim hover:text-ink">
            + New idea
          </Link>
        }
      />
      <main className="mx-auto w-full max-w-[660px] flex-1 px-6 pt-14 pb-12">
        {isPending && <p className="text-[15px] text-dim">…</p>}
        {isError && <p className="text-[15px] text-dim">Can't reach the API — is `npm run dev` running?</p>}

        {data && (
          <>
            {data.workIsDone ? (
              <>
                <Eyebrow tone="success">{WORK_DONE_EYEBROW}</Eyebrow>
                <Command sub={workDoneSub(data.postedOnDayCount, data.postedInWeekCount)}>{WORK_DONE_COMMAND}</Command>
              </>
            ) : (
              <>
                {(() => {
                  const [tone, label] = eyebrowFor(data.state, data.post?.adherenceStatus, data.post?.dueNotReady);
                  return (
                    <Eyebrow tone={tone} pulse={data.state === 'due' || data.post?.dueNotReady === true}>
                      {label}
                    </Eyebrow>
                  );
                })()}
                <Command sub={commandSub(data.state, ctx)}>{commandFor(data.state, ctx)}</Command>
              </>
            )}

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
            <TargetsStrip today={data} />
            {data.weeklyEffort.posts > 0 && (
              <p className="mt-2 text-center text-[12.5px] text-dim">
                {weeklyEffortLine(data.weeklyEffort.posts, data.weeklyEffort.load)}
              </p>
            )}
            {/* Phase 2 (D-50): contextual Weekly Review entry — only when there's a week to review. */}
            {data.weeklyEffort.posts > 0 && (
              <p className="mt-3 text-center">
                <Link to="/review" className="text-[12.5px] font-medium text-accent hover:underline">
                  {REVIEW_THIS_WEEK} →
                </Link>
              </p>
            )}
          </>
        )}
      </main>
    </div>
  );
}
