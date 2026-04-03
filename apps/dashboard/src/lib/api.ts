// apps/dashboard/src/lib/api.ts
import axios, { AxiosError } from 'axios';
import { getSession, signOut } from 'next-auth/react';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
});

// ── Attach dashboard JWT to every request ──────────────────
api.interceptors.request.use(async (config) => {
  const session = await getSession();
  if (session?.accessToken) {
    config.headers['Authorization'] = `Bearer ${session.accessToken as string}`;
  }
  return config;
});

// ── Centralised error handling ─────────────────────────────
let signingOut = false; // prevent multiple concurrent signOut calls

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<{ message?: string; code?: string }>) => {
    if (error.response?.status === 401 && typeof window !== 'undefined' && !signingOut) {
      signingOut = true;
      // Use NextAuth's signOut — clears the session cookie and all client
      // state properly before redirecting. window.location.href bypasses
      // this and can leave stale cookies causing redirect loops.
      await signOut({ callbackUrl: '/login', redirect: true });
    }
    return Promise.reject(error);
  },
);

// ── Partner API key instance (for testing partner endpoints)
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

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as Record<string, unknown> | undefined;
    return (data?.['message'] as string) ?? error.message;
  }
  if (error instanceof Error) return error.message;
  return 'An unexpected error occurred';
}