// ============================================================================
// FILE 1: lib/auth.ts - PRODUCTION FIXED
// ============================================================================
// ✅ CRITICAL FIX: Remove helper functions, simplify auth flow
// The old helper functions were creating and discarding response objects

import { createServerClient } from '@/lib/supabase';

export interface AuthUser {
  id: string;
  email?: string | null;
}

/**
 * ✅ SIMPLE VERSION: Get current user from session
 * Use this in API routes
 */
export async function getCurrentUser(
  req: Request
): Promise<AuthUser | null> {
  try {
    // Create minimal Supabase client for session check
    const supabase = createServerClient({ req });

    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
      console.error('⚠️ Session check failed:', error.message);
      return null;
    }

    if (!session?.user?.id) {
      console.log('ℹ️ No active session');
      return null;
    }

    return {
      id: session.user.id,
      email: session.user.email ?? null,
    };
  } catch (err) {
    console.error('❌ getCurrentUser() failed:', err);
    return null;
  }
}

/**
 * ✅ SIMPLE VERSION: Require authentication
 * Throws error if not authenticated
 */
export async function requireAuth(req: Request): Promise<AuthUser> {
  const user = await getCurrentUser(req);

  if (!user) {
    console.warn('🚫 Unauthorized: No session');
    const error = new Error('Authentication required');
    (error as any).status = 401;
    throw error;
  }

  return user;
}



