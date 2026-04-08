// apps/dashboard/src/app/api/notifications/count/route.ts
//
// Next.js App Router API route.
// The Navbar polls this to get the unread notification count badge
// without exposing the full notification list.
//
// Flow:
//   Navbar → GET /api/notifications/count (Next.js route, server-side)
//          → GET /v1/notifications         (NestJS backend, with JWT)
//          → returns { unreadCount }

import { NextResponse }     from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions }      from '@/lib/auth';

const API_URL =
  process.env.API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  'http://localhost:3001';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.accessToken) {
      return NextResponse.json({ unreadCount: 0 });
    }

    const res = await fetch(`${API_URL}/v1/notifications`, {
      headers: {
        Authorization:  `Bearer ${session.accessToken as string}`,
        'Content-Type': 'application/json',
      },
      // Don't cache — badge must be fresh
      cache: 'no-store',
    });

    if (!res.ok) {
      return NextResponse.json({ unreadCount: 0 });
    }

    const body = await res.json() as {
      success: boolean;
      data: { notifications: unknown[]; unreadCount: number };
    };

    return NextResponse.json({ unreadCount: body.data?.unreadCount ?? 0 });
  } catch {
    // Never let this crash the dashboard — just return 0
    return NextResponse.json({ unreadCount: 0 });
  }
}