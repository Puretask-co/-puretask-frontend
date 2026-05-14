/**
 * Session marker cookie — readable by middleware to gate route navigation.
 *
 * IMPORTANT: This is NOT a security boundary. The cookie is non-httpOnly so the
 * SPA can write/read it, which means a hostile client can forge it. The real
 * auth boundary is the Bearer token sent on every API call. This marker exists
 * only to:
 *   1. Stop middleware from shipping protected HTML to users who clearly are not
 *      logged in (defense in depth + faster redirect).
 *   2. Avoid the "see the page flash for 200ms before client-side RoleGuard
 *      redirects" UX problem.
 *
 * Real security: backend session cookies (httpOnly, signed). That requires
 * backend cookie issuance work and lives in a future migration.
 */

import type { User } from '@/types/api';

export const SESSION_COOKIE_NAME = 'puretask_session';
const MAX_AGE_SECONDS = 30 * 24 * 60 * 60; // 30 days, mirrors backend JWT expiry

function isBrowser(): boolean {
  return typeof document !== 'undefined';
}

function isSecure(): boolean {
  return typeof window !== 'undefined' && window.location.protocol === 'https:';
}

/** Set the marker cookie. Call after successful login/register/refresh. */
export function setSessionMarker(user: Pick<User, 'role'>): void {
  if (!isBrowser()) return;
  const parts = [
    `${SESSION_COOKIE_NAME}=${encodeURIComponent(user.role)}`,
    `Path=/`,
    `Max-Age=${MAX_AGE_SECONDS}`,
    `SameSite=Lax`,
  ];
  if (isSecure()) parts.push('Secure');
  document.cookie = parts.join('; ');
}

/** Clear the marker cookie. Call on logout / auth failure. */
export function clearSessionMarker(): void {
  if (!isBrowser()) return;
  const parts = [
    `${SESSION_COOKIE_NAME}=`,
    `Path=/`,
    `Max-Age=0`,
    `SameSite=Lax`,
  ];
  if (isSecure()) parts.push('Secure');
  document.cookie = parts.join('; ');
}
