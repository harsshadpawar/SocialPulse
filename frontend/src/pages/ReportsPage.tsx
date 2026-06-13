// v0.2k (D-64): Consistency Reports. Server derives state + numbers; this page owns every calm word
// (ADR-3). Never red — bars use one progressing-green scale shared with the capacity meter & effort tags.
import { useQuery } from '@tanstack/react-query';
import { fetchReports } from '../api/client';
import type { ReportPattern, ReportsView } from '../api/types';
import { NavHeader } from '../components/NavHeader';
import { PLATFORM_META } from '../lib/platform';

// completion % → progressing green (light → deep). Never red. (Mirrors the designer's greenFor.)
function greenFor(pct: number): string {
  const L = 79 - (pct / 100) * 33;
  const C = 0.055 + (pct / 100) * 0.055;
  return `oklch(${L}% ${C.toFixed(3)} 155)`;
}

const AS_OF = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: 'Asia/Dubai' });

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-dim">{children}</p>;
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-paper font-sans text-ink antialiased">
      <NavHeader active="reports" right={<span>as of {AS_OF.format(new Date())}</span>} />
      <main className="mx-auto w-full max-w-[640px] flex-1 px-6 pt-10 pb-12">{children}</main>
    </div>
  );
}

// The client owns the verdict words (ADR-3), composed from server state + numbers.
function verdict(d: ReportsView): string {
  if (d.state === 'rough') {
    const p = d.postsThisMonth;
    return `This stretch ran light — and you're already rebuilding. ${p} ${p === 1 ? 'post' : 'posts'} still went live this month.`;
  }
  if (d.state === 'sparse') {
    return `${d.streak} ${d.streak === 1 ? 'week' : 'weeks'} in a row — a real start. Your picture fills in as you keep posting.`;
  }
  return "You're showing up. The habit is holding.";
}

function patternText(p: ReportPattern): string {
  if (p.kind === 'reliable_weekday') return `You post most reliably on ${p.weekday}s.`;
  return 'Preparing ahead lifts your on-time rate.';
}

function StreakHeadline({ d }: { d: ReportsView }) {
  return (
    <>
      <h1 className="font-serif text-[26px] leading-[1.25]">{verdict(d)}</h1>
      <div className="mt-6 flex items-center gap-6 rounded-xl border border-ink/12 bg-white px-7 py-5 shadow-[0_1px_2px_rgba(40,35,25,0.05)]">
        <div className="text-[52px] font-semibold leading-none tabular-nums" style={{ color: greenFor(92) }}>{d.streak}</div>
        <div className="flex-1">
          <SectionLabel>Week streak</SectionLabel>
          <p className="mt-1 text-[15px]">in a row you posted at least your <b>light cadence</b>.</p>
        </div>
        <div className="flex gap-1.5">
          {d.weekDots.map((hit, i) => (
            <span key={i} className="size-3 rounded-full" style={{ background: hit ? greenFor(85) : 'var(--color-ink)', opacity: hit ? 1 : 0.12 }} />
          ))}
        </div>
      </div>
    </>
  );
}

function TrendChart({ d }: { d: ReportsView }) {
  return (
    <div className="rounded-xl border border-ink/12 bg-white p-5 shadow-[0_1px_2px_rgba(40,35,25,0.05)]">
      <div className="relative flex h-[170px] items-end gap-1.5">
        <div className="pointer-events-none absolute inset-x-0" style={{ bottom: `${d.capacityLinePct}%` }}>
          <div className="border-t border-dashed border-ink/25" />
          <span className="absolute -top-2 right-0 bg-white px-1.5 text-[10px] font-medium text-dim">capacity</span>
        </div>
        {d.trend.map((v, i) => (
          <div key={i} className="flex h-full flex-1 items-end">
            <div className="w-full rounded-t-[3px]" style={{ height: `${Math.max(5, v)}%`, background: greenFor(v) }} title={`${v}%`} />
          </div>
        ))}
      </div>
      <div className="mt-2.5 flex justify-between text-[10.5px] text-dim">
        <span>{d.windowWeeks} weeks ago</span>
        <span>this week</span>
      </div>
    </div>
  );
}

export function ReportsPage() {
  const { data: d, isPending } = useQuery({ queryKey: ['reports'], queryFn: fetchReports });

  if (isPending) {
    return (
      <Shell>
        <SectionLabel>Consistency</SectionLabel>
        <h1 className="mt-2 font-serif text-[27px] leading-[1.2] text-ink/50">Reading your weeks…</h1>
        <div className="mt-7 h-[92px] animate-pulse rounded-xl bg-ink/[0.07]" />
        <div className="mt-6 h-3.5 w-40 animate-pulse rounded bg-ink/[0.07]" />
        <div className="mt-3 flex h-[170px] items-end gap-1.5 rounded-xl border border-ink/10 bg-white p-5">
          {[40, 55, 70, 85, 45, 60, 75, 90, 50, 65, 80, 72].map((h, i) => (
            <div key={i} className="flex-1 animate-pulse rounded-t bg-ink/[0.07]" style={{ height: `${h}%` }} />
          ))}
        </div>
      </Shell>
    );
  }

  if (!d) {
    return <Shell><p className="pt-12 text-[15px] text-dim">Couldn't load your reports just now.</p></Shell>;
  }

  if (d.state === 'early') {
    return (
      <Shell>
        <SectionLabel>Consistency</SectionLabel>
        <h1 className="mt-2 font-serif text-[27px] leading-[1.2]">Your consistency picture is just starting.</h1>
        <div className="mt-8 rounded-2xl border border-dashed border-ink/15 bg-white px-8 py-12 text-center">
          <div className="flex items-end justify-center gap-2.5">
            <span className="w-7 rounded-t" style={{ height: 36, background: greenFor(45) }} />
            <span className="w-7 rounded-t" style={{ height: 60, background: greenFor(75) }} />
            <span className="w-7 rounded-t border border-dashed border-ink/20" style={{ height: 28 }} />
            <span className="w-7 rounded-t border border-dashed border-ink/20" style={{ height: 48 }} />
          </div>
          <p className="mx-auto mt-6 max-w-[42ch] text-[15px] leading-relaxed text-dim">
            Your trend builds as you post. Check back after a couple of weeks — there's no chart to fail at, just a picture filling in.
          </p>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <SectionLabel>Consistency · last {d.windowWeeks} weeks</SectionLabel>
      <div className="mt-2"><StreakHeadline d={d} /></div>

      <div className="mt-8">
        <SectionLabel>Completion — week by week</SectionLabel>
        <div className="mt-3"><TrendChart d={d} /></div>
        <p className="mt-2 text-[12.5px] text-dim">
          Each bar = completion % that week · dashed line = your capacity · a low week is a shorter bar, never red.
        </p>
      </div>

      {d.months.length > 0 && (
        <div className="mt-8">
          <SectionLabel>Months</SectionLabel>
          <div className="mt-3 overflow-hidden rounded-xl border border-ink/12 bg-white">
            {d.months.map((m, i) => (
              <div key={m.key} className={`flex items-center gap-4 px-5 py-3 ${i ? 'border-t border-ink/8' : ''}`}>
                <span className="w-9 text-[14px] font-semibold">{m.name}</span>
                <span className="h-2 w-24 overflow-hidden rounded-full bg-ink/10">
                  <span className="block h-full rounded-full" style={{ width: `${(m.weeksHit / m.weeksOf) * 100}%`, background: greenFor((m.weeksHit / m.weeksOf) * 100) }} />
                </span>
                <span className="text-[13px] tabular-nums text-dim">{m.weeksHit}/{m.weeksOf} wks</span>
                <span className="ml-auto text-[13px] tabular-nums text-dim">{m.posts} posts · {m.onTimePct}% on-time</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {d.platforms.length > 0 && (
        <div className="mt-8">
          <SectionLabel>Per platform — where you're most consistent</SectionLabel>
          <div className="mt-3 flex flex-col gap-3 rounded-xl border border-ink/12 bg-white px-5 py-4">
            {d.platforms.map((p) => (
              <div key={p.platform} className="flex items-center gap-3">
                <span className="size-2.5 shrink-0 rounded-full" style={{ background: PLATFORM_META[p.platform].color }} />
                <span className="w-[78px] text-[13.5px] font-medium">{PLATFORM_META[p.platform].label}</span>
                <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-ink/10">
                  <span className="block h-full rounded-full" style={{ width: `${(p.weeksHit / p.weeksOf) * 100}%`, background: greenFor((p.weeksHit / p.weeksOf) * 100) }} />
                </span>
                <span className="whitespace-nowrap text-[12.5px] tabular-nums text-dim">{p.weeksHit} of {p.weeksOf} wks</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {d.patterns.length > 0 && (
        <div className="mt-8">
          <SectionLabel>Gentle patterns</SectionLabel>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {d.patterns.map((p, i) => (
              <div key={i} className="rounded-xl border border-ink/12 bg-white px-5 py-4 text-[14px] leading-relaxed">{patternText(p)}</div>
            ))}
          </div>
        </div>
      )}
    </Shell>
  );
}
