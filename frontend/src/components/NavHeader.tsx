// v0.2d (D-46): the one restrained 3-way nav — Today · Calendar · Goals. No sidebar, no badges.
// Today stays the home/emotional center; Calendar and Goals are surfaces you visit to plan, then leave.
// Ported from hifi-v0.2d/hifi-calendar.jsx → NavHeader.
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

const TABS = [
  { id: 'today', label: 'Today', to: '/' },
  { id: 'calendar', label: 'Calendar', to: '/calendar' },
  { id: 'goals', label: 'Goals', to: '/goals' },
] as const;

export function NavHeader({ active, right }: { active: 'today' | 'calendar' | 'goals'; right?: ReactNode }) {
  return (
    <header className="border-b border-ink/10 px-12">
      <div className="flex items-center justify-between py-5">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="SocialPulse" className="size-7 rounded-lg" />
          <span className="text-[16px] font-semibold tracking-tight">SocialPulse</span>
        </div>
        <nav className="flex gap-1 rounded-lg bg-ink/5 p-1 text-[13.5px]">
          {TABS.map((t) => (
            <Link
              key={t.id}
              to={t.to}
              className={`rounded-md px-4 py-1.5 ${
                active === t.id
                  ? 'bg-white font-semibold text-ink shadow-[0_1px_2px_rgba(40,35,25,0.08)]'
                  : 'text-dim hover:text-ink'
              }`}
            >
              {t.label}
            </Link>
          ))}
        </nav>
        <span className="flex min-w-[140px] items-center justify-end gap-5 text-[14px] tabular-nums text-dim">{right}</span>
      </div>
    </header>
  );
}
