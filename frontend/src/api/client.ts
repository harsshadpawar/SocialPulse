import type {
  CalendarView,
  Commitments,
  GoalsView,
  MarkReadyResponse,
  Platform,
  PostView,
  Reflection,
  TargetView,
  TodayView,
  UpdatePostInput,
  WeeklyReviewView,
} from './types';

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: init?.body ? { 'Content-Type': 'application/json' } : undefined,
    ...init,
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: { code: string; message: string } } | null;
    throw new ApiError(res.status, body?.error?.code ?? 'unknown', body?.error?.message ?? `API ${res.status}`);
  }
  return (await res.json()) as T;
}

export function fetchToday(): Promise<TodayView> {
  return request<TodayView>('/api/today');
}

export function fetchPost(id: string): Promise<PostView> {
  return request<{ post: PostView }>(`/api/posts/${id}`).then((r) => r.post);
}

export function createIdea(input: { title: string; coreMessage: string }): Promise<PostView> {
  return request<{ post: PostView }>('/api/ideas', {
    method: 'POST',
    body: JSON.stringify(input),
  }).then((r) => r.post);
}

export function updatePost(id: string, input: UpdatePostInput): Promise<PostView> {
  return request<{ post: PostView }>(`/api/posts/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  }).then((r) => r.post);
}

export function markReady(id: string): Promise<MarkReadyResponse> {
  return request<MarkReadyResponse>(`/api/posts/${id}/ready`, { method: 'POST' });
}

export function updateTarget(input: TargetView): Promise<TargetView> {
  return request<TargetView>('/api/target', { method: 'PUT', body: JSON.stringify(input) });
}

export function keepAsMissed(id: string): Promise<PostView> {
  return request<{ post: PostView }>(`/api/posts/${id}/keep-missed`, { method: 'POST' }).then((r) => r.post);
}

export function quickStart(id: string): Promise<PostView> {
  return request<{ post: PostView }>(`/api/posts/${id}/quick-start`, { method: 'POST' }).then((r) => r.post);
}

export function repurpose(id: string, platform: Platform): Promise<PostView> {
  return request<{ post: PostView }>(`/api/posts/${id}/repurpose`, {
    method: 'POST',
    body: JSON.stringify({ platform }),
  }).then((r) => r.post);
}

export function fetchCalendar(): Promise<CalendarView> {
  return request<CalendarView>('/api/calendar');
}

export function fetchGoals(): Promise<GoalsView> {
  return request<GoalsView>('/api/goals');
}

export function saveCommitments(input: Commitments): Promise<GoalsView> {
  return request<GoalsView>('/api/goals', { method: 'PUT', body: JSON.stringify(input) });
}

export function fetchWeeklyReview(): Promise<WeeklyReviewView> {
  return request<WeeklyReviewView>('/api/weekly-review');
}

export function saveReflection(input: Reflection): Promise<WeeklyReviewView> {
  return request<WeeklyReviewView>('/api/weekly-review/reflection', { method: 'PUT', body: JSON.stringify(input) });
}

export function markPosted(
  id: string,
  input: { actualDatetime?: string; nativePostUrl?: string },
): Promise<PostView> {
  return request<{ post: PostView }>(`/api/posts/${id}/posted`, {
    method: 'POST',
    body: JSON.stringify(input),
  }).then((r) => r.post);
}
