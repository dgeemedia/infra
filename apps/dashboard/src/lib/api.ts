// apps/dashboard/src/lib/api.ts
import axios, { AxiosError } from 'axios';
import { getSession }        from 'next-auth/react';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

// ── Axios instance ─────────────────────────────────────────
export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
});

// ── Attach JWT session token to every dashboard request ────
api.interceptors.request.use(async (config) => {
  const session = await getSession();
  if (session?.accessToken) {
    config.headers['Authorization'] = `Bearer ${session.accessToken as string}`;
  }
  return config;
});

// ── Centralised error handling ─────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message?: string; code?: string }>) => {
    if (error.response?.status === 401) {
      // Session expired — redirect to login
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);

// ── Partner API key instance (for testing endpoints) ───────
export function createPartnerClient(apiKey: string) {
  return axios.create({
    baseURL: BASE_URL,
    timeout: 15_000,
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
  });
}

// ── Helper: extract error message ──────────────────────────
export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as Record<string, unknown> | undefined;
    return (data?.['message'] as string) ?? error.message;
  }
  if (error instanceof Error) return error.message;
  return 'An unexpected error occurred';
}
