// v0.2j (D-60): custom Instrument date+time control — replaces native datetime-local.
// One popover, month grid + time list. Value is a local 'YYYY-MM-DDTHH:mm' string ('' = unset).
// Asia/Dubai is the product clock; the value carries no zone (interpreted local at create, like before).
import { useEffect, useRef, useState } from 'react';
import { BtnPrimary } from './ui';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DOW = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

// 48 half-hour slots, value 'HH:mm'.
const TIME_SLOTS: string[] = Array.from({ length: 48 }, (_, i) => {
  const h = Math.floor(i / 2);
  const m = i % 2 === 0 ? '00' : '30';
  return `${String(h).padStart(2, '0')}:${m}`;
});

function parse(value: string): { y: number; mo: number; d: number; time: string } | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}:\d{2})$/.exec(value);
  if (!m) return null;
  return { y: Number(m[1]), mo: Number(m[2]) - 1, d: Number(m[3]), time: m[4]! };
}

function time12(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number);
  const ap = h! < 12 ? 'AM' : 'PM';
  const h12 = h! % 12 === 0 ? 12 : h! % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${ap}`;
}

export function formatDateTime(value: string): string {
  const p = parse(value);
  if (!p) return 'Set date · time';
  return `${p.d} ${MONTHS[p.mo]} · ${time12(p.time)}`;
}

const CalIcon = () => (
  <svg className="size-3.5 shrink-0 text-dim" viewBox="0 0 16 16" fill="none">
    <rect x="2.5" y="3.5" width="11" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
    <path d="M2.5 6.5h11M5.5 2v3M10.5 2v3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
  </svg>
);

interface Props {
  value: string; // 'YYYY-MM-DDTHH:mm' or ''
  onChange: (v: string) => void;
  disabled?: boolean;
  edited?: boolean;
}

export function DateTimePicker({ value, onChange, disabled, edited }: Props) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const parsed = parse(value);
  const today = new Date();
  const [view, setView] = useState({ y: parsed?.y ?? today.getFullYear(), mo: parsed?.mo ?? today.getMonth() });

  // Re-anchor the month view whenever opened on a value.
  useEffect(() => {
    if (open && parsed) setView({ y: parsed.y, mo: parsed.mo });
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  // Close on outside click.
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const selTime = parsed?.time ?? '09:00';

  function pickDay(day: number) {
    const key = `${view.y}-${String(view.mo + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    onChange(`${key}T${selTime}`);
  }
  function pickTime(t: string) {
    const datePart = parsed
      ? `${parsed.y}-${String(parsed.mo + 1).padStart(2, '0')}-${String(parsed.d).padStart(2, '0')}`
      : `${view.y}-${String(view.mo + 1).padStart(2, '0')}-01`;
    onChange(`${datePart}T${t}`);
  }
  function step(delta: number) {
    setView((v) => {
      const mo = v.mo + delta;
      return { y: v.y + Math.floor(mo / 12), mo: ((mo % 12) + 12) % 12 };
    });
  }

  // Month grid (Sunday-first).
  const firstDow = new Date(view.y, view.mo, 1).getDay();
  const daysInMonth = new Date(view.y, view.mo + 1, 0).getDate();
  const cells: (number | null)[] = [...Array(firstDow).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="relative" ref={wrapRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className={`inline-flex items-center gap-2 whitespace-nowrap rounded-lg border bg-white px-3 py-1.5 text-[13px] tabular-nums ${
          edited ? 'border-accent/40' : 'border-ink/15'
        } disabled:bg-ink/3 disabled:text-ink/40 hover:border-ink/25`}
      >
        <CalIcon />
        {formatDateTime(value)}
        {edited && <span className="size-1.5 rounded-full bg-accent" title="edited — kept" />}
      </button>

      {open && (
        <div className="absolute right-0 z-20 mt-2 w-[360px] rounded-xl border border-ink/12 bg-white p-4 shadow-[0_8px_30px_rgba(40,35,25,0.12)]">
          <div className="flex items-center justify-between px-1 pb-3">
            <button type="button" onClick={() => step(-1)} className="flex size-7 items-center justify-center rounded-md text-dim hover:bg-ink/5">‹</button>
            <span className="font-serif text-[16px]">{MONTHS_LONG[view.mo]} {view.y}</span>
            <button type="button" onClick={() => step(1)} className="flex size-7 items-center justify-center rounded-md text-dim hover:bg-ink/5">›</button>
          </div>
          <div className="flex gap-3">
            <div className="grid grid-cols-7 gap-0.5">
              {DOW.map((dy, i) => (
                <span key={i} className="flex size-8 items-center justify-center text-[10px] font-semibold uppercase text-dim">{dy}</span>
              ))}
              {cells.map((day, i) => {
                const isSel = parsed && day === parsed.d && view.y === parsed.y && view.mo === parsed.mo;
                return (
                  <button
                    key={i}
                    type="button"
                    disabled={!day}
                    onClick={() => day && pickDay(day)}
                    className={`flex size-8 items-center justify-center rounded-full text-[13px] tabular-nums ${
                      isSel ? 'bg-accent font-semibold text-white' : day ? 'hover:bg-ink/5' : ''
                    }`}
                  >
                    {day ?? ''}
                  </button>
                );
              })}
            </div>
            <div className="w-px bg-ink/8" />
            <div className="flex w-[92px] flex-col">
              <span className="px-1 pb-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-dim">Time</span>
              <div className="flex max-h-[232px] flex-col gap-0.5 overflow-auto pr-1">
                {TIME_SLOTS.map((t) => {
                  const on = t === selTime;
                  return (
                    <button
                      key={t}
                      type="button"
                      ref={on ? (el) => el?.scrollIntoView({ block: 'center' }) : undefined}
                      onClick={() => pickTime(t)}
                      className={`shrink-0 rounded-md px-2.5 py-1.5 text-left text-[13px] tabular-nums ${
                        on ? 'bg-accent/10 font-semibold text-accent' : 'text-ink/80 hover:bg-ink/5'
                      }`}
                    >
                      {time12(t)}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-ink/8 pt-3">
            <span className="text-[13px] tabular-nums text-dim">{formatDateTime(value)}</span>
            <BtnPrimary className="px-5 py-1.5 text-[13.5px]" onClick={() => setOpen(false)}>Done</BtnPrimary>
          </div>
        </div>
      )}
    </div>
  );
}
