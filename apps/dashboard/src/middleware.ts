// apps/dashboard/src/middleware.ts
//
// Enforces the password-change redirect at the edge.
// Every request to a dashboard route (except /change-password itself)
// is checked. If the session token has mustChangePassword=true the
// user is redirected to /change-password regardless of which URL
// they typed.

import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token as {
      mustChangePassword?: boolean;
      role?: string;
    } | null;

    const pathname = req.nextUrl.pathname;

    // Already on the change-password page — let through
    if (pathname === '/change-password') return NextResponse.next();

    // Force redirect if temp password hasn't been changed yet
    if (token?.mustChangePassword) {
      return NextResponse.redirect(new URL('/change-password', req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      // withAuth already ensures the user is authenticated;
      // returning true here means "allow the middleware function to run"
      authorized: ({ token }) => !!token,
    },
  },
);

// Apply to all dashboard routes — not to auth pages or public API
export const config = {
  matcher: [
    '/((?!login|interest|api|_next/static|_next/image|favicon.ico).*)',
  ],
};