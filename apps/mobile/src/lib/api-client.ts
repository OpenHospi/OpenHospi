import { API_BASE_URL } from '@/lib/constants';
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
      return false;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

// Exported so session-refresh.ts can share the same mutex
export { refreshPromise, refreshSession };

// ── Session expired event ───────────────────────────────────
// Emitted when 401 retry fails. Picked up by SessionProvider
// to navigate to login.

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

// ── Core request function ───────────────────────────────────

async function executeRequest<T>(
  method: string,
  url: string,
  headers: Record<string, string>,
  body?: BodyInit
): Promise<T> {
  const response = await fetch(url, {
    method,
    headers,
    credentials: 'omit',
    body,
  });

  if (response.status === 204) return undefined as T;

  if (!response.ok) {
    let errorMessage = response.statusText;
    let errorCode: string | undefined;
    try {
      const errorBody = (await response.json()) as { message?: string; code?: string };
      if (errorBody.message) errorMessage = errorBody.message;
      if (errorBody.code) errorCode = errorBody.code;
    } catch {
      // response body wasn't JSON
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
  // Check network before attempting request
  const { isOnline } = getNetworkStatus();
  if (!isOnline) {
    throw new NetworkError();
  }

  const url = `${API_BASE_URL}${path}`;
  const authHeaders = getAuthHeaders();

  const headers: Record<string, string> = { ...authHeaders };
  let requestBody: BodyInit | undefined;

  if (isFormData) {
    // FormData sets its own Content-Type with boundary
    requestBody = body as FormData;
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    requestBody = JSON.stringify(body);
  }

  try {
    return await executeRequest<T>(method, url, headers, requestBody);
  } catch (error) {
    // Network errors (fetch itself failed)
    if (error instanceof TypeError && error.message.includes('Network')) {
      throw new NetworkError(error.message);
    }

    // 401 — attempt session refresh and retry once
    if (error instanceof ApiError && error.status === 401) {
      const refreshed = await refreshSession();

      if (refreshed) {
        // Retry with fresh auth headers
        const freshHeaders: Record<string, string> = {
          ...getAuthHeaders(),
        };
        if (!isFormData && body !== undefined) {
          freshHeaders['Content-Type'] = 'application/json';
        }
        return executeRequest<T>(method, url, freshHeaders, requestBody);
      }

      // Refresh failed — session is truly expired
      emitSessionExpired();
      throw error;
    }

    throw error;
  }
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
