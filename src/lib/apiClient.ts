// src/lib/apiClient.ts
// Single fetch-based API client for all API calls (Trust hooks, services, etc.).
// Attaches Bearer token to every request. Use this client—not raw fetch—for backend calls.
// Token is stored in localStorage under STORAGE_KEYS.AUTH_TOKEN ('puretask_token').

import { STORAGE_KEYS } from './config';

export type ApiError = {
  status: number;
  message: string;
  details?: unknown;
};

const REQUEST_ID_HEADER = 'x-request-id';
const CORRELATION_ID_HEADER = 'x-correlation-id';

function createRequestId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `fe-${crypto.randomUUID()}`;
  }
  return `fe-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function getApiBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    ''
  ).replace(/\/$/, '');
}

/** Token key: STORAGE_KEYS.AUTH_TOKEN ('puretask_token'). Same as AuthContext and api.ts. */
function getAuthHeaders(): Record<string, string> {
  const token =
    typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN) : null;
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function parseError(res: Response): Promise<ApiError> {
  let details: unknown = undefined;
  try {
    details = await res.json();
  } catch {
    // ignore
  }

  const msg =
    (typeof (details as Record<string, unknown>)?.message === 'string' &&
      (details as Record<string, unknown>).message) ||
    res.statusText ||
    'Request failed';
  return {
    status: res.status,
    message: typeof msg === 'string' ? msg : 'Request failed',
    details,
  };
}

function buildHeaders(extra?: Record<string, string>): Record<string, string> {
  const requestId = createRequestId();
  return {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    [REQUEST_ID_HEADER]: requestId,
    [CORRELATION_ID_HEADER]: requestId,
    ...getAuthHeaders(),
    ...(extra || {}),
  };
}

export async function apiGet<T>(path: string, init?: RequestInit): Promise<T> {
  const base = getApiBaseUrl();
  const url = base ? `${base}${path}` : path;
  const requestId = createRequestId();
  const headers = {
    Accept: 'application/json',
    [REQUEST_ID_HEADER]: requestId,
    [CORRELATION_ID_HEADER]: requestId,
    ...getAuthHeaders(),
    ...(init?.headers || {}),
  };

  const res = await fetch(url, {
    method: 'GET',
    credentials: 'include',
    headers,
    ...init,
  });

  if (!res.ok) throw await parseError(res);
  return (await res.json()) as T;
}

export async function apiPost<TReq, TRes>(
  path: string,
  body: TReq,
  init?: RequestInit
): Promise<TRes> {
  const base = getApiBaseUrl();
  const url = base ? `${base}${path}` : path;

  const res = await fetch(url, {
    method: 'POST',
    credentials: 'include',
    headers: buildHeaders(init?.headers as Record<string, string>),
    body: JSON.stringify(body),
    ...init,
  });

  if (!res.ok) throw await parseError(res);
  return (await res.json()) as TRes;
}

export async function apiPut<TReq, TRes>(
  path: string,
  body: TReq,
  init?: RequestInit
): Promise<TRes> {
  const base = getApiBaseUrl();
  const url = base ? `${base}${path}` : path;

  const res = await fetch(url, {
    method: 'PUT',
    credentials: 'include',
    headers: buildHeaders(init?.headers as Record<string, string>),
    body: JSON.stringify(body),
    ...init,
  });

  if (!res.ok) throw await parseError(res);
  return (await res.json()) as TRes;
}

export async function apiPatch<TReq, TRes>(
  path: string,
  body: TReq,
  init?: RequestInit
): Promise<TRes> {
  const base = getApiBaseUrl();
  const url = base ? `${base}${path}` : path;

  const res = await fetch(url, {
    method: 'PATCH',
    credentials: 'include',
    headers: buildHeaders(init?.headers as Record<string, string>),
    body: JSON.stringify(body),
    ...init,
  });

  if (!res.ok) throw await parseError(res);
  return (await res.json()) as TRes;
}

export async function apiDelete<T>(path: string, init?: RequestInit): Promise<T> {
  const base = getApiBaseUrl();
  const url = base ? `${base}${path}` : path;
  const requestId = createRequestId();
  const headers = {
    Accept: 'application/json',
    [REQUEST_ID_HEADER]: requestId,
    [CORRELATION_ID_HEADER]: requestId,
    ...getAuthHeaders(),
    ...(init?.headers || {}),
  };

  const res = await fetch(url, {
    method: 'DELETE',
    credentials: 'include',
    headers,
    ...init,
  });

  if (!res.ok) throw await parseError(res);
  const text = await res.text();
  return (text ? JSON.parse(text) : null) as T;
}
