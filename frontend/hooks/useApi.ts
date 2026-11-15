'use client';

import { useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';

/**
 * Returns a typed fetch wrapper that:
 * 1. Injects the in-memory access token as Bearer
 * 2. On 401, attempts a silent refresh and retries the request once
 * 3. Throws a friendly Error on failure
 */
export function useApi() {
  const { token, refreshToken } = useAuth();

  const request = useCallback(
    async <T>(
      path: string,
      options: RequestInit = {}
    ): Promise<T> => {
      const makeRequest = async (accessToken: string | null): Promise<Response> => {
        const headers: HeadersInit = {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          ...((options.headers as Record<string, string>) ?? {}),
        };
        return fetch(`/api/proxy${path}`, { ...options, headers });
      };

      let res = await makeRequest(token);

      // On 401, attempt silent refresh + retry once
      if (res.status === 401) {
        const newToken = await refreshToken();
        if (newToken) {
          res = await makeRequest(newToken);
        }
      }

      if (!res.ok) {
        let message = `Request failed: ${res.status} ${res.statusText}`;
        try {
          const body = await res.json();
          if (body.message) message = body.message;
          else if (body.error) message = body.error;
        } catch {
          // ignore
        }
        const err = new Error(message) as Error & { status: number };
        err.status = res.status;
        throw err;
      }

      if (res.status === 204) return undefined as T;
      return res.json() as Promise<T>;
    },
    [token, refreshToken]
  );

  return { request };
}
