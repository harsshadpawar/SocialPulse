import type { MarkReadyResponse, PostView, TodayView, UpdatePostInput } from './types';

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
