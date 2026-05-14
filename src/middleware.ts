/**
 * Server-side route gating via the puretask_session marker cookie.
 *
 * IMPORTANT: This is NOT a security boundary. The marker is a non-httpOnly
 * cookie that the SPA writes after login (see src/lib/sessionMarker.ts), and
 * a hostile client can forge it trivially. The real auth boundary is the
 * Bearer JWT sent on every API call.
 *
 * What this middleware actually buys us:
 *   - Avoid shipping protected-page HTML to users with no marker (UX + small
 *     defense-in-depth win against accidental link sharing).
 *   - Eliminate the brief "see the page before client RoleGuard kicks in"
 *     flicker on protected routes.
 *
 * A real httpOnly session cookie requires backend cooperation (currently
 * Bearer-only); when that lands, this file becomes a true gate and the
 * forgeable marker can be retired.
 */

import { NextResponse, type NextRequest } from 'next/server';
import { SESSION_COOKIE_NAME } from '@/lib/sessionMarker';

type Role = 'admin' | 'cleaner' | 'client';

// Path prefix => roles allowed to see it. Admin sees everything.
const PROTECTED_PREFIXES: Array<{ prefix: string; allow: Role[] }> = [
  { prefix: '/admin', allow: ['admin'] },
  { prefix: '/cleaner', allow: ['cleaner', 'admin'] },
  { prefix: '/client', allow: ['client', 'admin'] },
];

function isProtected(pathname: string): { allow: Role[] } | null {
  for (const { prefix, allow } of PROTECTED_PREFIXES) {
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
      return { allow };
    }
  }
  return null;
}

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  const match = isProtected(pathname);
  if (!match) return NextResponse.next();

  const marker = req.cookies.get(SESSION_COOKIE_NAME)?.value;

  if (!marker || !match.allow.includes(marker as Role)) {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = '/auth/login';
    loginUrl.search = '';
    loginUrl.searchParams.set('returnTo', `${pathname}${search}`);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  // Run on every path except Next internals, static files, and the auth
  // entry points themselves. (The matcher syntax below excludes _next/static,
  // _next/image, favicon, manifest, and any path with a file extension.)
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|.*\\..*).*)',
  ],
};
