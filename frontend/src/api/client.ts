import type { TodayView } from './types';

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`API ${res.status} on ${url}`);
  return (await res.json()) as T;
}

export function fetchToday(): Promise<TodayView> {
  return getJson<TodayView>('/api/today');
}
