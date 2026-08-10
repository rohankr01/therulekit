// ============================================================================
// app/api/auth/callback/route.ts - PRODUCTION OAuth Callback v8.1
// ============================================================================
// ✅ Supabase OAuth callback handler (Google, GitHub, etc.)
// ✅ Security: Validates OAuth code parameter
// ✅ Security: Prevents open redirect vulnerabilities
// ✅ FIXED: Cookie handling - returns SAME response that sets cookies
// ✅ Error handling: Graceful degradation
// ✅ Observability: SecureLogger for production monitoring

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { SecureLogger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

/**
 * GET /api/auth/callback
 * 
 * Handles OAuth callback from Supabase Auth
 * 
 * Flow:
 * 1. User clicks "Sign in with Google/GitHub"
 * 2. Redirected to provider (Google/GitHub)
 * 3. Provider redirects back here with ?code=...
 * 4. We exchange code for session
 * 5. Redirect to app with auth cookies set
 * 
 * Security:
 * - Validates OAuth code parameter exists
 * - Uses absolute URLs (prevents open redirect)
 * - Secure cookie handling via createServerClient
 * 
 * ✅ v8.1 FIX: Cookie handling
 * - Create redirect response FIRST
 * - Pass to createServerClient
 * - Return SAME response (preserves cookies)
 */
export async function GET(req: NextRequest) {
  const requestId = crypto.randomUUID();
  console.info('[auth-debug]', '/auth/callback request', {
    requestId,
    url: req.nextUrl.pathname,
    hasCode: Boolean(req.nextUrl.searchParams.get('code')),
    hasError: Boolean(req.nextUrl.searchParams.get('error')),
    time: new Date().toISOString(),
  });

  try {
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // STEP 1: Validate OAuth Parameters
    // ✅ SECURITY: Ensure this is a legitimate OAuth callback
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    // Handle OAuth provider errors (user denied access, etc.)
    if (error) {
      console.warn('[auth-debug]', '/auth/callback provider error', {
        requestId,
        error,
        errorDescription,
        time: new Date().toISOString(),
      });
      SecureLogger.error('OAuth provider error', { error, errorDescription });
      const errorUrl = new URL('/auth/error', req.url);
      errorUrl.searchParams.set('message', errorDescription || 'Authentication failed');
      return NextResponse.redirect(errorUrl);
    }

    // Validate OAuth code exists
    if (!code) {
      console.warn('[auth-debug]', '/auth/callback missing code', {
        requestId,
        time: new Date().toISOString(),
      });
      SecureLogger.warn('OAuth callback missing code parameter');
      const errorUrl = new URL('/auth/error', req.url);
      errorUrl.searchParams.set('message', 'Invalid authentication request');
      return NextResponse.redirect(errorUrl);
    }

    SecureLogger.info('OAuth callback received with valid code');

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // STEP 2: Determine Redirect URL
    // ✅ SECURITY: Use absolute URLs to prevent open redirect
    // ✅ SECURITY: Validate redirect_to is on same origin
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    
    const redirectTo = searchParams.get('redirect_to');
    let redirectUrl: URL;

    if (redirectTo) {
      try {
        // Validate redirect URL is safe (same origin only)
        const testUrl = new URL(redirectTo, req.url);
        const requestUrl = new URL(req.url);
        
        // Only allow same-origin redirects (security)
        if (testUrl.origin === requestUrl.origin) {
          redirectUrl = testUrl;
          SecureLogger.info(`Redirecting to requested path: ${redirectTo}`);
        } else {
          SecureLogger.warn(`Blocked cross-origin redirect: ${redirectTo}`);
          redirectUrl = new URL('/', req.url);
        }
      } catch {
        // Invalid URL format, use default
        SecureLogger.warn(`Invalid redirect_to URL: ${redirectTo}`);
        redirectUrl = new URL('/', req.url);
      }
    } else {
      // Default: redirect to home
      redirectUrl = new URL('/', req.url);
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // STEP 3: Create Redirect Response FIRST
    // ✅ CRITICAL FIX: Create response before Supabase client
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    
    const res = NextResponse.redirect(redirectUrl);

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // STEP 4: Initialize Supabase Client
    // ✅ Pass the redirect response - Supabase will write cookies to it
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    
    const supabase = createServerClient({ req, res });

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // STEP 5: Exchange OAuth Code for Session
    // ✅ This sets secure auth cookies on the redirect response
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    console.info('[auth-debug]', '/auth/callback exchangeCodeForSession response', {
      requestId,
      ok: !exchangeError,
      hasSession: Boolean(data.session),
      hasUser: Boolean(data.user),
      errorMessage: exchangeError?.message,
      time: new Date().toISOString(),
    });

    if (exchangeError) {
      console.error('[auth-debug]', '/auth/callback returning auth error redirect', {
        requestId,
        errorMessage: exchangeError.message,
        time: new Date().toISOString(),
      });
      SecureLogger.error('Session exchange failed', exchangeError);
      
      // Create new error response (don't reuse res)
      const errorUrl = new URL('/auth/error', req.url);
      errorUrl.searchParams.set('message', 'Failed to complete authentication');
      return NextResponse.redirect(errorUrl);
    }

    if (!data.session || !data.user) {
      console.error('[auth-debug]', '/auth/callback returning incomplete auth redirect', {
        requestId,
        time: new Date().toISOString(),
      });
      SecureLogger.error('Session exchange returned no session', null);
      
      // Create new error response
      const errorUrl = new URL('/auth/error', req.url);
      errorUrl.searchParams.set('message', 'Authentication incomplete');
      return NextResponse.redirect(errorUrl);
    }

    SecureLogger.success(`OAuth session created for user: ${data.user.email}`);
    console.info('[auth-debug]', '/auth/callback returning success redirect', {
      requestId,
      userId: data.user.id,
      time: new Date().toISOString(),
    });

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // STEP 6: Return SAME Response (Preserves Cookies)
    // ✅ CRITICAL: Return the response that has cookies set
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    
    return res;

  } catch (error) {
    console.error('[auth-debug]', '/auth/callback returning 500 redirect', {
      requestId,
      errorMessage: (error as Error)?.message,
      time: new Date().toISOString(),
    });
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // ERROR HANDLING
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    
    SecureLogger.error('Unexpected error in OAuth callback', error);
    
    const errorUrl = new URL('/auth/error', req.url);
    errorUrl.searchParams.set(
      'message', 
      process.env.NODE_ENV === 'development'
        ? (error as Error).message
        : 'An unexpected error occurred'
    );
    
    return NextResponse.redirect(errorUrl);
  }
}

/**
 * Optional: Handle POST requests (some OAuth providers use POST)
 * Most providers use GET, but this ensures compatibility
 */
export async function POST(req: NextRequest) {
  // Delegate to GET handler
  return GET(req);
}



