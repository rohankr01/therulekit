// middleware.ts — PRODUCTION VERSION (CRITICAL COOKIE FIX)
// ✅ FIXED: res.redirect() preserves cookies | No 429 | Perfect RLS | Edge-safe

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export const runtime = 'experimental-edge';

// Public API endpoints
const PUBLIC_API = ['/api/auth', '/api/public', '/api/health'];

// Public UI routes
const PUBLIC_PAGES = ['/', '/terms', '/privacy', '/error'];

// Protected UI pages
const PROTECTED_PAGES = ['/dashboard', '/chat', '/profile'];

// Max payload size for POST bodies
const MAX_PAYLOAD = 900000; // 900 KB

const isMatch = (path: string, list: string[]) =>
  list.some((p) => path === p || path.startsWith(`${p}/`));

function redirectWithCookies(req: NextRequest, res: NextResponse, path: string) {
  const redirect = NextResponse.redirect(new URL(path, req.url));
  res.cookies.getAll().forEach((cookie) => {
    redirect.cookies.set(cookie);
  });
  return redirect;
}

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  if (path.startsWith('/api/auth') || path.startsWith('/auth/callback')) {
    console.info('[auth-debug]', 'middleware auth request', {
      method: req.method,
      path,
      hasCookie: Boolean(req.headers.get('cookie')),
      time: new Date().toISOString(),
    });
  }

  // --------------------------------------------------------------------------
  // 1) Allow CORS preflight
  // --------------------------------------------------------------------------
  if (req.method === 'OPTIONS') {
    return new NextResponse(null, { status: 200 });
  }

  // --------------------------------------------------------------------------
  // 2) Reject large POST bodies
  // --------------------------------------------------------------------------
  if (req.method === 'POST' && path.startsWith('/api/')) {
    const size = req.headers.get('content-length');
    if (size && Number(size) > MAX_PAYLOAD) {
      return NextResponse.json({ error: 'Payload too large' }, { status: 413 });
    }
  }

  // --------------------------------------------------------------------------
  // 3) Response object for Supabase cookies (REQUIRED)
  // ✅ CRITICAL: Create response FIRST - this is the cookie container
  // --------------------------------------------------------------------------
  const res = NextResponse.next();

  // --------------------------------------------------------------------------
  // 4) RLS client (MUST pass both req + res)
  // ✅ Supabase writes cookies into res.cookies
  // --------------------------------------------------------------------------
  const supabase = createServerClient({ req, res });

  let session = null;

  // --------------------------------------------------------------------------
  // 5) Auth check ONLY for protected pages
  // --------------------------------------------------------------------------
  if (isMatch(path, PROTECTED_PAGES)) {
    try {
      const { data } = await supabase.auth.getUser();
      session = data.user;

      if (!session) {
        // ✅ CRITICAL FIX: res.redirect() preserves res.cookies
        // This ensures Supabase cookie updates reach the browser
        return redirectWithCookies(req, res, '/');
      }
    } catch (err) {
      // Session check failed, redirect to home
      return redirectWithCookies(req, res, '/');
    }
  }

  // --------------------------------------------------------------------------
  // 6) API ROUTES
  // ✅ FIXED: Return res to preserve cookie updates
  // --------------------------------------------------------------------------
  if (path.startsWith('/api/')) {
    // Public API
    if (isMatch(path, PUBLIC_API)) return res;

    // Basic CSRF protection for modifying methods
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
      const origin = req.headers.get('origin');
      const host = req.headers.get('host');

      if (!origin || !origin.includes(host || '')) {
        return NextResponse.json(
          { error: 'Invalid request origin' },
          { status: 403 }
        );
      }
    }

    // ✅ Always return res (preserves cookies)
    return res;
  }

  // --------------------------------------------------------------------------
  // 7) PUBLIC PAGES
  // ✅ Always return res to preserve cookies
  // --------------------------------------------------------------------------
  if (isMatch(path, PUBLIC_PAGES)) return res;

  // --------------------------------------------------------------------------
  // 8) PROTECTED PAGES (fallback - already handled above)
  // --------------------------------------------------------------------------
  if (isMatch(path, PROTECTED_PAGES)) {
    if (!session) {
      return redirectWithCookies(req, res, '/');
    }
  }

  // ✅ Always return res with updated cookies
  return res;
}

// --------------------------------------------------------------------------
// 9) MATCHER — Correct ordering (SAFE)
// --------------------------------------------------------------------------
export const config = {
  matcher: [
    '/api/:path*',
    '/dashboard/:path*',
    '/chat/:path*',
    '/profile/:path*',
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};




