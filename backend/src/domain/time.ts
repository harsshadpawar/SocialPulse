// Day-boundary helpers. The ONLY timezone-aware code in the domain.
// Adherence/status are instant arithmetic and never need a timezone;
// the tz matters only for "which Dubai calendar day does this instant belong to".

const fmtCache = new Map<string, Intl.DateTimeFormat>();

function dayFormatter(tz: string): Intl.DateTimeFormat {
  let fmt = fmtCache.get(tz);
  if (!fmt) {
    // en-CA yields YYYY-MM-DD — lexicographically ordered.
    fmt = new Intl.DateTimeFormat('en-CA', {
      timeZone: tz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    fmtCache.set(tz, fmt);
  }
  return fmt;
}

/** Calendar-day key (YYYY-MM-DD) of an instant in the given timezone. */
export function dayKey(instant: Date, tz: string): string {
  return dayFormatter(tz).format(instant);
}

export function isSameDay(a: Date, b: Date, tz: string): boolean {
  return dayKey(a, tz) === dayKey(b, tz);
}

export function isFutureDay(instant: Date, now: Date, tz: string): boolean {
  return dayKey(instant, tz) > dayKey(now, tz);
}
