// ============================================================================
// app/api/usage/route.ts - PRODUCTION v9.0 (All Security Requirements)
// ============================================================================
// ✅ REQUIREMENT #1: Rate limiting
// ✅ No JSON input validation needed (GET request only)
// ✅ Uses getUser() for authentication
// ✅ Usage checks use admin client internally (in usage-limits.ts)

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, headersWithSupabaseCookies } from '@/lib/supabase';
import { checkUsageLimit } from '@/lib/usage-limits';
import { SecureLogger } from '@/lib/logger';
import rateLimit, { getClientIP } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

// ============================================================================
// REQUIREMENT #1: RATE LIMITING
// ============================================================================

const limiter = rateLimit({
  interval: 60 * 1000, // 1 minute window
  uniqueTokenPerInterval: 500,
});

const RATE_LIMIT_MAX = 30; // 30 requests per minute (generous for usage checks)

// ============================================================================
// GET /api/usage - Returns current user's query usage stats
// ============================================================================

export async function GET(req: NextRequest) {
  try {
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // STEP 1: Rate Limiting (IP-based)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    
    const clientIP = getClientIP(req);
    try {
      await limiter.check(RATE_LIMIT_MAX, clientIP);
    } catch (rateLimitError: any) {
      const retryAfter = rateLimitError?.retryAfter ?? 60;
      console.warn(`⚠️ Rate limit exceeded for IP: ${clientIP} on /api/usage`);
      return NextResponse.json(
        { 
          error: 'Too many requests. Please wait a moment.',
          retryAfter
        },
        { 
          status: 429, 
          headers: { 'Retry-After': retryAfter.toString() } 
        }
      );
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // STEP 2: Authentication
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    
    const res = NextResponse.json({});
    const supabase = createServerClient({ req, res });

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError) {
      console.error('⚠️ Auth error in /api/usage:', authError.message);
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 401, headers: res.headers }
      );
    }

    if (!user) {
      SecureLogger.warn('🚫 Unauthenticated access attempt to /api/usage');
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401, headers: res.headers }
      );
    }

    console.log(`✅ Fetching usage for user: ${user.email}`);

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // STEP 3: Fetch Usage
    // Note: checkUsageLimit() uses admin client internally (bypasses RLS safely)
    // This route itself uses standard cookie-based auth
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    
    const usageCheck = await checkUsageLimit(user.id, req);

    SecureLogger.success(
      `✅ Usage data fetched for user ${user.id}: ${usageCheck.queryCount} queries`
    );

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // STEP 4: Return Response
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    
    return NextResponse.json(
      {
        queryCount: usageCheck.queryCount,
        allowed: usageCheck.allowed,
        reason: usageCheck.reason,
      },
      {
        status: 200,
        headers: headersWithSupabaseCookies(res, {
          'Cache-Control': 'no-store, max-age=0', // Never cache usage data
        }),
      }
    );
  } catch (error: any) {
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // ERROR HANDLING
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    
    SecureLogger.error('❌ Usage API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch usage data',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
