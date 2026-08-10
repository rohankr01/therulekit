// ============================================================================
// lib/supabase.ts - PRODUCTION CLIENT (Browser + API Routes Only)
// ============================================================================
// ✅ Browser: Cookie-based client (SSR-compatible)
// ✅ API Routes: SSR client with request context
// ✅ Middleware: SSR client with request context
// ❌ Scripts: NEVER use this file - use supabase-admin.ts instead
// 
// USAGE:
// - Browser/Client Components: getBrowserClient()
// - API Routes: createServerClient({ req, res })
// - Middleware: createServerClient({ req, res })
// - Scripts/CLI: Use lib/supabase-admin.ts (NOT this file)

import { createBrowserClient, createServerClient as createSSRClient } from '@supabase/ssr';
import type { NextRequest, NextResponse } from 'next/server';
import type { Database } from '@/types';

// ============================================================================
// 1. BROWSER CLIENT - Cookie storage (SSR-compatible)
// ============================================================================

let browserClient: ReturnType<typeof createBrowserClient<Database>> | null = null;

/**
 * Get Supabase client for browser/client components
 * Uses cookie storage for SSR compatibility
 * 
 * @example
 * ```typescript
 * import { getBrowserClient } from '@/lib/supabase';
 * const supabase = getBrowserClient();
 * const { data } = await supabase.from('code_sections').select('*');
 * ```
 */
export function getBrowserClient() {
  if (browserClient) return browserClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  if (!url || !anonKey) {
    throw new Error(
      'Missing Supabase environment variables:\n' +
      '  - NEXT_PUBLIC_SUPABASE_URL\n' +
      '  - NEXT_PUBLIC_SUPABASE_ANON_KEY\n' +
      'Check your .env.local file.'
    );
  }

  // ✅ Uses createBrowserClient from @supabase/ssr
  // Stores session in COOKIES (not localStorage)
  browserClient = createBrowserClient<Database>(url, anonKey);

  return browserClient;
}

// ============================================================================
// 2. SERVER CLIENT - For API routes & middleware ONLY
// ============================================================================

/**
 * Create Supabase SSR client for API routes and middleware
 * 
 * ⚠️ WARNING: Requires Request/Response context
 * ⚠️ For scripts/ingestion, use lib/supabase-admin.ts instead
 * 
 * @param options - Request and optional Response objects
 * @returns Supabase client with cookie-based auth
 * 
 * @example API Route
 * ```typescript
 * import { createServerClient } from '@/lib/supabase';
 * 
 * export async function GET(req: Request) {
 *   const supabase = createServerClient({ req });
 *   const { data } = await supabase.from('code_sections').select('*');
 *   return Response.json(data);
 * }
 * ```
 * 
 * @example Middleware
 * ```typescript
 * import { createServerClient } from '@/lib/supabase';
 * 
 * export function middleware(req: NextRequest) {
 *   const res = NextResponse.json({});
 *   const supabase = createServerClient({ req, res });
 *   // ... auth logic
 *   return res;
 * }
 * ```
 */
export function createServerClient(options: {
  req: NextRequest | Request;
  res?: NextResponse | Response;
}) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  if (!url || !anonKey) {
    throw new Error(
      'Missing Supabase environment variables:\n' +
      '  - NEXT_PUBLIC_SUPABASE_URL\n' +
      '  - NEXT_PUBLIC_SUPABASE_ANON_KEY\n' +
      'Check your .env.local file.'
    );
  }

  const { req, res } = options;

  // Cookie getter - handles both NextRequest and Request
  const getCookie = (name: string): string | undefined => {
    try {
      // NextRequest has cookies.get() method
      if ('cookies' in req && typeof req.cookies.get === 'function') {
        const cookie = req.cookies.get(name);
        return cookie?.value;
      }

      // Fallback: Parse cookie header manually
      const cookieHeader = req.headers.get('cookie');
      if (!cookieHeader) return undefined;

      const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
        const [key, value] = cookie.trim().split('=');
        if (key && value) {
          acc[key] = decodeURIComponent(value);
        }
        return acc;
      }, {} as Record<string, string>);

      return cookies[name];
    } catch (error) {
      console.warn(`[Supabase] Cookie getter error for ${name}:`, error);
      return undefined;
    }
  };

  // Cookie setter - handles NextResponse. Keep cookies readable by the
  // browser Supabase client; @supabase/ssr stores client auth in cookies.
  const setCookie = (name: string, value: string, options: any) => {
    if (!res) return;

    try {
      // NextResponse has cookies.set() method
      if ('cookies' in res && typeof res.cookies.set === 'function') {
        res.cookies.set(name, value, {
          ...options,
          httpOnly: options?.httpOnly ?? false,
          sameSite: 'lax',
          secure: process.env.NODE_ENV === 'production',
          path: '/',
        });
      }
    } catch (error) {
      console.warn(`[Supabase] Cookie setter error for ${name}:`, error);
    }
  };

  // Cookie remover - handles both NextResponse and Response
  const removeCookie = (name: string, options: any) => {
    if (!res) return;

    try {
      if ('cookies' in res && typeof res.cookies.delete === 'function') {
        res.cookies.delete(name);
      }
    } catch (error) {
      console.warn(`[Supabase] Cookie remover error for ${name}:`, error);
    }
  };

  return createSSRClient<Database>(url, anonKey, {
    cookies: {
      get: getCookie,
      set: setCookie,
      remove: removeCookie,
    },
  });
}

export function headersWithSupabaseCookies(
  res: NextResponse | Response,
  init?: HeadersInit
) {
  const headers = new Headers(res.headers);
  if (init) {
    new Headers(init).forEach((value, key) => {
      headers.set(key, value);
    });
  }
  return headers;
}

// ============================================================================
// 3. TYPE EXPORTS (for convenience)
// ============================================================================

export type SupabaseClient = ReturnType<typeof getBrowserClient>;
export type ServerClient = ReturnType<typeof createServerClient>;



