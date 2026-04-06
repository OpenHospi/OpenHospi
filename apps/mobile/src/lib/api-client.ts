import * as Sentry from '@sentry/react-native';

import { API_BASE_URL, API_TIMEOUT_MS, AUTH_REFRESH_TIMEOUT_MS } from '@/lib/constants';
import { authClient } from '@/lib/auth-client';
import { getNetworkStatus } from '@/lib/network';

// ── Error types ─────────────────────────────────────────────

export class ApiError extends Error {
  readonly isNetworkError = false;

  constructor(
    public readonly status: number,
    message: string,
    public readonly code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class NetworkError extends Error {
  readonly isNetworkError = true;
  readonly status = 0;

  constructor(message = 'No internet connection') {
    super(message);
    this.name = 'NetworkError';
  }
}

// ── Session refresh mutex ───────────────────────────────────
// When multiple concurrent requests get 401, only one should
// trigger a session refresh. Others wait for the result.

let refreshPromise: Promise<boolean> | null = null;

async function refreshSession(): Promise<boolean> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const result = await authClient.getSession();
      return !!result.data;
    } catch {
      // Wait before allowing another refresh attempt (backoff with jitter)
      await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 500));
      return false;
    }
  })();

  try {
    return await refreshPromise;
  } finally {
    refreshPromise = null;
  }
}

export { refreshPromise, refreshSession };

// ── Session expired event ───────────────────────────────────

type SessionExpiredListener = () => void;
const sessionExpiredListeners = new Set<SessionExpiredListener>();

export function onSessionExpired(listener: SessionExpiredListener): () => void {
  sessionExpiredListeners.add(listener);
  return () => sessionExpiredListeners.delete(listener);
}

function emitSessionExpired() {
  for (const listener of sessionExpiredListeners) {
    listener();
  }
}

// ── Auth headers ────────────────────────────────────────────

function getAuthHeaders(): Record<string, string> {
  const cookies = authClient.getCookie();
  if (!cookies) return {};
  return { Cookie: cookies };
}

// ── Request timeout ─────────────────────────────────────────

function fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(timeout));
}

// ── Request deduplication ───────────────────────────────────
// Prevents two identical concurrent GET requests from both
// hitting the network. The second caller gets the same promise.

const inFlightRequests = new Map<string, Promise<unknown>>();

function getDeduplicationKey(method: string, url: string): string | null {
  // Only deduplicate GET requests — mutations must always execute
  if (method !== 'GET') return null;
  return `${method}:${url}`;
}

// ── Core request function ───────────────────────────────────

async function executeRequest<T>(
  method: string,
  url: string,
  headers: Record<string, string>,
  body: BodyInit | undefined,
  timeoutMs: number
): Promise<T> {
  const response = await fetchWithTimeout(
    url,
    { method, headers, credentials: 'omit', body },
    timeoutMs
  );

  if (response.status === 204) return undefined as T;

  if (!response.ok) {
    let errorMessage = response.statusText;
    let errorCode: string | undefined;
    try {
      const errorBody = (await response.json()) as { message?: string; code?: string };
      if (errorBody.message) errorMessage = errorBody.message;
      if (errorBody.code) errorCode = errorBody.code;
    } catch (parseError) {
      Sentry.addBreadcrumb({
        category: 'api',
        message: `Failed to parse error body for ${method} ${url}: ${parseError}`,
        level: 'warning',
      });
    }
    throw new ApiError(response.status, errorMessage, errorCode);
  }

  return response.json() as Promise<T>;
}

// ── Request with auth resilience ────────────────────────────

async function resilientRequest<T>(
  method: string,
  path: string,
  body?: unknown,
  isFormData = false
): Promise<T> {
  const { isOnline } = getNetworkStatus();
  if (!isOnline) {
    throw new NetworkError();
  }

  const url = `${API_BASE_URL}${path}`;

  // Deduplicate concurrent identical GET requests
  const deduplicationKey = getDeduplicationKey(method, url);
  if (deduplicationKey) {
    const existing = inFlightRequests.get(deduplicationKey);
    if (existing) return existing as Promise<T>;
  }

  const promise = (async (): Promise<T> => {
    const authHeaders = getAuthHeaders();
    const headers: Record<string, string> = { ...authHeaders };
    let requestBody: BodyInit | undefined;

    if (isFormData) {
      requestBody = body as FormData;
    } else if (body !== undefined) {
      headers['Content-Type'] = 'application/json';
      requestBody = JSON.stringify(body);
    }

    try {
      return await executeRequest<T>(method, url, headers, requestBody, API_TIMEOUT_MS);
    } catch (error) {
      // Timeout (AbortController fired)
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new NetworkError('Request timed out');
      }

      // Network errors (fetch itself failed — DNS, connection refused, etc.)
      if (error instanceof TypeError) {
        throw new NetworkError(error.message);
      }

      // 401 — attempt session refresh and retry once
      if (error instanceof ApiError && error.status === 401) {
        const refreshed = await refreshSession();

        if (refreshed) {
          const freshHeaders: Record<string, string> = { ...getAuthHeaders() };
          if (!isFormData && body !== undefined) {
            freshHeaders['Content-Type'] = 'application/json';
          }
          return executeRequest<T>(method, url, freshHeaders, requestBody, AUTH_REFRESH_TIMEOUT_MS);
        }

        emitSessionExpired();
        throw error;
      }

      throw error;
    }
  })();

  // Store the in-flight promise for deduplication
  if (deduplicationKey) {
    inFlightRequests.set(deduplicationKey, promise);
    promise.finally(() => inFlightRequests.delete(deduplicationKey));
  }

  return promise;
}

// ── Public API ──────────────────────────────────────────────

export const api = {
  get: <T>(path: string) => resilientRequest<T>('GET', path),
  post: <T>(path: string, body?: unknown) => resilientRequest<T>('POST', path, body),
  patch: <T>(path: string, body?: unknown) => resilientRequest<T>('PATCH', path, body),
  delete: (path: string) => resilientRequest<void>('DELETE', path),
  postFormData: <T>(path: string, formData: FormData) =>
    resilientRequest<T>('POST', path, formData, true),
};
