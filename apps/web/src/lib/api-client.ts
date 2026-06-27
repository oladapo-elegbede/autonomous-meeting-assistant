import type { ApiResponse } from '@meeting-assistant/shared';
import { clientEnv } from '@/lib/env/client';

/**
 * Typed API client for talking to our backend.
 *
 * Every request includes the Clerk JWT in the Authorization header.
 * Every response is unwrapped from our standard ApiResponse envelope,
 * so callers get the data directly or throw on errors.
 */

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  token?: string;
};

class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, token } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${clientEnv.apiUrl}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const payload = (await response.json()) as ApiResponse<T>;

  if (!payload.success) {
    throw new ApiError(payload.error.code, payload.error.message, response.status);
  }

  return payload.data;
}

export const apiClient = {
  get: <T>(path: string, token?: string) => request<T>(path, { method: 'GET', token }),

  post: <T>(path: string, body?: unknown, token?: string) =>
    request<T>(path, { method: 'POST', body, token }),

  patch: <T>(path: string, body?: unknown, token?: string) =>
    request<T>(path, { method: 'PATCH', body, token }),

  delete: <T>(path: string, token?: string) => request<T>(path, { method: 'DELETE', token }),
};

/**
 * Uploads a file directly to a pre-signed URL with progress tracking.
 *
 * Used for browser → Supabase direct uploads. The signed URL already
 * includes authorization, so no token is sent.
 *
 * Returns a promise that resolves when the upload completes.
 * The onProgress callback fires repeatedly with values 0-100.
 */
export function uploadToSignedUrl(
  signedUrl: string,
  file: File,
  options?: { onProgress?: (percent: number) => void; signal?: AbortSignal },
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable && options?.onProgress) {
        const percent = Math.round((event.loaded / event.total) * 100);
        options.onProgress(percent);
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(
          new ApiError('UPLOAD_FAILED', `Upload failed with status ${xhr.status}`, xhr.status),
        );
      }
    });

    xhr.addEventListener('error', () => {
      reject(new ApiError('UPLOAD_NETWORK_ERROR', 'Network error during upload', 0));
    });

    xhr.addEventListener('abort', () => {
      reject(new ApiError('UPLOAD_ABORTED', 'Upload was cancelled', 0));
    });

    if (options?.signal) {
      options.signal.addEventListener('abort', () => xhr.abort());
    }

    xhr.open('PUT', signedUrl);
    xhr.setRequestHeader('Content-Type', file.type);
    xhr.send(file);
  });
}

export { ApiError };
