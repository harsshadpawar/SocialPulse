// Display formatting only — all in Asia/Dubai (config-driven on the server; fixed label here for v0.1).
const TZ = 'Asia/Dubai';

const timeFmt = new Intl.DateTimeFormat('en-US', {
  hour: 'numeric',
  minute: '2-digit',
  timeZone: TZ,
});

const dateFmt = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  timeZone: TZ,
});

const dayKeyFmt = new Intl.DateTimeFormat('en-CA', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  timeZone: TZ,
});

export function formatTime(iso: string): string {
  return timeFmt.format(new Date(iso));
}

/** "Today · 8:30 PM" or "Jun 13 · 9:00 AM" — relative to the viewer's now, in Dubai days. */
export function formatTargetLine(iso: string): string {
  const target = new Date(iso);
  const sameDay = dayKeyFmt.format(target) === dayKeyFmt.format(new Date());
  return sameDay ? `Today · ${timeFmt.format(target)}` : `${dateFmt.format(target)} · ${timeFmt.format(target)}`;
}

/** Readout-cell datetime: time-only when the instant is today (Dubai), date-prefixed otherwise.
 *  Prevents cross-day pairs like target "Jun 13 · 10:00 AM" vs posted "8:08 PM" reading as same-day. */
export function formatWhen(iso: string): string {
  const d = new Date(iso);
  const sameDay = dayKeyFmt.format(d) === dayKeyFmt.format(new Date());
  return sameDay ? timeFmt.format(d) : `${dateFmt.format(d)} · ${timeFmt.format(d)}`;
}

export function formatHeaderDate(now: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    timeZone: TZ,
  }).format(now);
}
