// "Instrument" design system — typed, interactive port of hifi/hifi-system.jsx.
// Tailwind classes are kept verbatim from the approved hi-fi; only behavior is added
// (real handlers, controlled inputs — the design package's primitives were readOnly mocks).
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

/* ── Header ── */

const DUBAI_HEADER_FMT = new Intl.DateTimeFormat('en-US', {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  timeZone: 'Asia/Dubai',
});

function headerClock(): string {
  // "Thu · Jun 12 · 8:31 PM"
  const parts = DUBAI_HEADER_FMT.formatToParts(new Date());
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '';
  return `${get('weekday')} · ${get('month')} ${get('day')} · ${get('hour')}:${get('minute')} ${get('dayPeriod')}`;
}

export function IHeader({ back, right }: { back?: string; right?: string }) {
  return (
    <header className="border-b border-ink/10 px-12">
      <div className="flex items-center justify-between py-5">
        {back ? (
          <Link to="/" className="flex items-center gap-2 text-[14.5px] font-medium text-dim hover:text-ink">
            ← {back}
          </Link>
        ) : (
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="SocialPulse" className="size-7 rounded-lg" />
            <span className="text-[16px] font-semibold tracking-tight">SocialPulse</span>
          </div>
        )}
        <span className="text-[14px] tabular-nums text-dim">{right ?? headerClock()}</span>
      </div>
    </header>
  );
}

/* ── Eyebrow status line: dot + uppercase label ── */

export type Tone = 'accent' | 'dim' | 'success' | 'late' | 'missed';

export function Eyebrow({ tone = 'dim', pulse, children }: { tone?: Tone; pulse?: boolean; children: ReactNode }) {
  const text = { accent: 'text-accent', dim: 'text-dim', success: 'text-success', late: 'text-late', missed: 'text-missed' }[tone];
  const dot = { accent: 'bg-accent', dim: 'bg-ink/30', success: 'bg-success', late: 'bg-late', missed: 'bg-missed' }[tone];
  return (
    <div className="flex items-center gap-2.5">
      <span className="relative flex size-2.5">
        {pulse && <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-60 motion-reduce:hidden ${dot}`}></span>}
        <span className={`relative inline-flex size-2.5 rounded-full ${dot}`}></span>
      </span>
      <p className={`text-[12.5px] font-semibold uppercase tracking-[0.18em] ${text}`}>{children}</p>
    </div>
  );
}

export function Command({ children, sub }: { children: ReactNode; sub?: string }) {
  return (
    <>
      <h1 className="mt-3 font-serif text-[36px] leading-[1.18] text-balance">{children}</h1>
      {sub && <p className="mt-3 max-w-[52ch] text-[15.5px] leading-relaxed text-dim">{sub}</p>}
    </>
  );
}

export function ICard({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <section className={`overflow-hidden rounded-xl border border-ink/12 bg-white shadow-[0_1px_2px_rgba(40,35,25,0.05)] ${className}`}>
      {children}
    </section>
  );
}

/* ── Instrument readout strip — dl grid with hairline dividers ── */

export function Readout({ cells, cols }: { cells: [string, ReactNode][]; cols?: 2 | 4 }) {
  return (
    <dl className={`grid divide-x divide-ink/8 border-y border-ink/8 ${cols === 2 ? 'grid-cols-2 divide-y' : 'grid-cols-4'}`}>
      {cells.map(([label, value], i) => (
        <div key={i} className="px-5 py-4">
          <dt className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-dim">{label}</dt>
          <dd className="mt-1.5 text-[14px] font-medium">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

/* ── Buttons ── */

interface BtnProps {
  children: ReactNode;
  className?: string;
  disabled?: boolean;
  title?: string;
  onClick?: () => void;
  to?: string; // renders a router Link styled identically
  href?: string; // renders an external <a>
  type?: 'button' | 'submit';
}

function renderBtn(cls: string, { children, className = '', disabled, title, onClick, to, href, type = 'button' }: BtnProps) {
  const full = `${cls} ${className}`;
  if (to && !disabled) {
    return <Link to={to} className={`${full} inline-flex items-center justify-center`}>{children}</Link>;
  }
  if (href && !disabled) {
    return <a href={href} target="_blank" rel="noreferrer" className={`${full} inline-flex items-center justify-center`}>{children}</a>;
  }
  return (
    <button type={type} disabled={disabled} title={title} onClick={onClick} className={full}>
      {children}
    </button>
  );
}

export function BtnPrimary(props: BtnProps) {
  return renderBtn(
    `rounded-lg bg-accent py-2.5 text-[15px] font-semibold text-white hover:brightness-105 disabled:opacity-40 disabled:hover:brightness-100`,
    props,
  );
}

export function BtnSecondary(props: BtnProps) {
  const cls = props.disabled
    ? 'rounded-lg border py-2.5 text-[14.5px] font-medium border-ink/8 text-ink/30'
    : 'rounded-lg border py-2.5 text-[14.5px] font-medium border-ink/15 text-ink hover:bg-ink/5';
  return renderBtn(cls, props);
}

export function BtnGhost(props: BtnProps) {
  return renderBtn(`rounded-lg py-2.5 text-[14.5px] font-medium text-dim hover:text-ink`, props);
}

/* ── Platform badge — the brand dot is the ONLY brand color allowed in the UI ── */

export function PlatformBadge({ name, color }: { name: string; color: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[14px] font-medium">
      <span className="size-[7px] rounded-full" style={{ backgroundColor: color }}></span>
      {name}
    </span>
  );
}

/* ── Fields ── */

const FIELD_BASE =
  'mt-1.5 w-full rounded-lg border border-ink/15 bg-white px-3.5 text-[15px] text-ink placeholder:text-ink/35 focus:outline-2 focus:outline-accent/60 disabled:bg-ink/3 disabled:text-ink/45';

interface IFieldProps {
  label: string;
  value: string;
  placeholder?: string;
  textarea?: boolean;
  helper?: string;
  right?: ReactNode;
  disabled?: boolean;
  type?: string;
  rows?: number;
  onChange?: (value: string) => void;
  onBlur?: () => void;
}

export function IField({ label, value, placeholder, textarea, helper, right, disabled, type = 'text', rows = 4, onChange, onBlur }: IFieldProps) {
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <label className="text-[11px] font-semibold uppercase tracking-[0.14em] text-dim">{label}</label>
        {right}
      </div>
      {textarea ? (
        <textarea
          rows={rows}
          className={`${FIELD_BASE} resize-none py-2.5 leading-relaxed`}
          value={value}
          placeholder={placeholder}
          disabled={disabled}
          onChange={(e) => onChange?.(e.target.value)}
          onBlur={onBlur}
        />
      ) : (
        <input
          type={type}
          className={`${FIELD_BASE} py-2.5`}
          value={value}
          placeholder={placeholder}
          disabled={disabled}
          onChange={(e) => onChange?.(e.target.value)}
          onBlur={onBlur}
        />
      )}
      {helper && <p className="mt-1.5 text-[13px] text-dim">{helper}</p>}
    </div>
  );
}

interface ISelectProps<T extends string> {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  disabled?: boolean;
  onChange?: (value: T) => void;
}

export function ISelect<T extends string>({ label, value, options, disabled, onChange }: ISelectProps<T>) {
  return (
    <div>
      <label className="text-[11px] font-semibold uppercase tracking-[0.14em] text-dim">{label}</label>
      <div className="relative mt-1.5">
        <select
          className="w-full appearance-none rounded-lg border border-ink/15 bg-white px-3.5 py-2.5 text-[15px] font-medium text-ink focus:outline-2 focus:outline-accent/60 disabled:bg-ink/3 disabled:text-ink/45"
          value={value}
          disabled={disabled}
          onChange={(e) => onChange?.(e.target.value as T)}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <svg className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-dim" viewBox="0 0 16 16" fill="none">
          <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  );
}

/* ── Status pill ── */

export function StatusPill({ tone = 'dim', children }: { tone?: Tone; children: ReactNode }) {
  const cls = {
    accent: 'bg-accent/10 text-accent',
    success: 'bg-success/12 text-success',
    late: 'bg-late/15 text-late',
    dim: 'bg-ink/6 text-ink/60',
    missed: 'bg-missed/10 text-missed',
  }[tone];
  return <span className={`inline-flex rounded-full px-3 py-1 text-[12.5px] font-semibold ${cls}`}>{children}</span>;
}
