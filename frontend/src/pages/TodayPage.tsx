import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { fetchToday } from '../api/client';
import { TodayCard } from '../components/TodayCard';
import { formatHeaderDate } from '../lib/format';
import { EMPTY_CARD_BODY, EMPTY_CTA, commandFor } from '../lib/microcopy';

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
    <main className="shell">
      <header className="header">
        <span className="wordmark">● SocialPulse</span>
        <span className="header-date">{formatHeaderDate(new Date())}</span>
      </header>

      {isPending && <p className="quiet">…</p>}
      {isError && <p className="quiet">Can't reach the API — is `npm run dev` running?</p>}

      {data && (
        <>
          <div className="command">
            <span className="label">Today's Command</span>
            <h1 className="command-text">{commandFor(data.state, data.post?.platform)}</h1>
          </div>

          {data.post ? (
            <TodayCard post={data.post} />
          ) : (
            <>
              <div className="empty-card">
                <div className="empty-mark">○</div>
                <div>{EMPTY_CARD_BODY}</div>
              </div>
              <Link to="/ideas/new" className="btn btn-primary">
                {EMPTY_CTA}
              </Link>
            </>
          )}
        </>
      )}
    </main>
  );
}
