import { useEffect, useState } from 'react';

// M0 shell: proves the full chain browser → vite proxy → Express → response.
// M1 replaces the body with TodayPage rendering GET /api/today.

type ApiStatus = 'checking' | 'ok' | 'down';

export function App() {
  const [apiStatus, setApiStatus] = useState<ApiStatus>('checking');

  useEffect(() => {
    fetch('/api/health')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then(() => setApiStatus('ok'))
      .catch(() => setApiStatus('down'));
  }, []);

  return (
    <main className="shell">
      <header className="header">
        <span className="wordmark">● SocialPulse</span>
        <span className="header-date">
          {new Intl.DateTimeFormat('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            timeZone: 'Asia/Dubai',
          }).format(new Date())}
        </span>
      </header>
      <p className="m0-note">
        M0 scaffold · API:{' '}
        {apiStatus === 'checking' ? 'checking…' : apiStatus === 'ok' ? 'connected ✓' : 'not reachable'}
      </p>
    </main>
  );
}
