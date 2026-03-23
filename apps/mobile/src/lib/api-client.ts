import { API_BASE_URL } from '@/lib/constants';
import { authClient } from '@/lib/auth-client';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

function getAuthHeaders(): Record<string, string> {
  const cookies = authClient.getCookie();
  if (!cookies) return {};
  return { Cookie: cookies };
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const authHeaders = getAuthHeaders();
  const headers: Record<string, string> = {
    ...authHeaders,
  };

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    credentials: 'omit',
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

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

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

async function postFormData<T>(path: string, formData: FormData): Promise<T> {
  const authHeaders = getAuthHeaders();

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: authHeaders,
    credentials: 'omit',
    body: formData,
  });

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

export const api = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body),
  patch: <T>(path: string, body?: unknown) => request<T>('PATCH', path, body),
  delete: (path: string) => request<void>('DELETE', path),
  postFormData: <T>(path: string, formData: FormData) => postFormData<T>(path, formData),
};
