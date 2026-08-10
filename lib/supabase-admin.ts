// ============================================================================
// lib/supabase-admin.ts - ADMIN CLIENT FOR SCRIPTS & BACKEND OPERATIONS
// ============================================================================
// ⚠️ SERVICE ROLE KEY - Has FULL database access (bypasses RLS)
// ✅ Use ONLY in server-side scripts (setup-vector-db.ts, migrations, cron jobs)
// ❌ NEVER import in browser/client components
// ❌ NEVER expose service role key to browser
//
// SECURITY:
// - Bypasses Row Level Security (RLS)
// - Has superuser privileges
// - Can read/write any data
// - Can modify database structure
// - Uses SUPABASE_URL (server-only, NOT NEXT_PUBLIC_*)
//
// USAGE:
// ```typescript
// import { getAdminClient } from '@/lib/supabase-admin';
// const supabase = getAdminClient();
// await supabase.from('code_sections').insert(...);
// ```

import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types';

// ============================================================================
// ADMIN CLIENT - SERVICE ROLE (Full Access)
// ============================================================================

/**
 * Singleton admin client instance
 * Created lazily on first access
 */
let adminClient: ReturnType<typeof createClient<Database>> | null = null;

/**
 * Get Supabase admin client with SERVICE ROLE privileges
 * 
 * ⚠️ SECURITY WARNING:
 * - Has FULL database access (bypasses RLS)
 * - Only use in server-side scripts
 * - Never expose service role key to browser
 * - Never use in API routes unless absolutely necessary
 * 
 * ✅ SAFE to use in:
 * - scripts/setup-vector-db.ts
 * - Database migrations
 * - Cron jobs / scheduled tasks
 * - Admin CLI tools
 * - Backend data processing
 * 
 * ❌ NEVER use in:
 * - Browser/Client components
 * - Public API routes (use lib/supabase.ts instead)
 * - Any client-side code
 * 
 * Environment Variables Required:
 * - SUPABASE_URL (server-only, NOT NEXT_PUBLIC_SUPABASE_URL)
 * - SUPABASE_SERVICE_ROLE_KEY
 * 
 * @returns Supabase client with admin privileges
 * @throws Error if environment variables are missing
 * 
 * @example Basic usage
 * ```typescript
 * import { getAdminClient } from '@/lib/supabase-admin';
 * 
 * const supabase = getAdminClient();
 * const { data, error } = await supabase
 *   .from('code_sections')
 *   .insert({ ... });
 * ```
 * 
 * @example In setup-vector-db.ts
 * ```typescript
 * import { getAdminClient } from '../lib/supabase-admin';
 * 
 * async function setupDatabase() {
 *   const supabase = getAdminClient();
 *   
 *   // Bypass RLS - can delete all data
 *   await supabase.from('code_sections').delete().neq('id', '00000000-0000-0000-0000-000000000000');
 *   
 *   // Bulk insert without auth checks
 *   await supabase.from('code_sections').insert(sections);
 * }
 * ```
 */
export function getAdminClient() {
  if (adminClient) return adminClient;

  // ✅ FIXED: Use SUPABASE_URL (server-only) instead of NEXT_PUBLIC_SUPABASE_URL
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) {
    throw new Error(
      'Missing SUPABASE_URL environment variable.\n' +
      'Add this to your .env.local file:\n' +
      '  SUPABASE_URL=https://your-project.supabase.co\n\n' +
      '⚠️  Use SUPABASE_URL (server-only) not NEXT_PUBLIC_SUPABASE_URL\n' +
      '   Admin code should never depend on NEXT_PUBLIC_* variables.'
    );
  }

  if (!serviceKey) {
    throw new Error(
      'Missing SUPABASE_SERVICE_ROLE_KEY environment variable.\n' +
      'Add this to your .env.local file:\n' +
      '  SUPABASE_SERVICE_ROLE_KEY=your-service-role-key\n\n' +
      '⚠️ WARNING: This key has FULL database access.\n' +
      '   Never commit it to version control.\n' +
      '   Never expose it to the browser.'
    );
  }

  // Validate environment (never use service role in browser)
  if (typeof window !== 'undefined') {
    throw new Error(
      '🚨 SECURITY ERROR: getAdminClient() called in browser context!\n' +
      '   Admin client can only be used in server-side code.\n' +
      '   For browser/client code, use getBrowserClient() from lib/supabase.ts'
    );
  }

  // Warn in development if using NEXT_PUBLIC_* fallback
  if (process.env.NODE_ENV === 'development' && !process.env.SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_URL) {
    console.warn(
      '⚠️  Using NEXT_PUBLIC_SUPABASE_URL as fallback for admin client.\n' +
      '   For better security hygiene, add SUPABASE_URL to .env.local:\n' +
      `   SUPABASE_URL=${process.env.NEXT_PUBLIC_SUPABASE_URL}`
    );
  }

  adminClient = createClient<Database>(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    // Disable realtime for admin client (not needed for scripts)
    realtime: {
      params: {
        eventsPerSecond: -1,
      },
    },
  });

  return adminClient;
}

/**
 * Create a new admin client instance (non-singleton)
 * Use this if you need multiple isolated clients
 * 
 * @returns New Supabase admin client
 * 
 * @example
 * ```typescript
 * import { createAdminClient } from '@/lib/supabase-admin';
 * 
 * const supabase1 = createAdminClient();
 * const supabase2 = createAdminClient(); // Separate instance
 * ```
 */
export function createAdminClient() {
  // ✅ FIXED: Use SUPABASE_URL (server-only)
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      'Missing Supabase admin credentials. Required:\n' +
      '  - SUPABASE_URL (server-only, preferred)\n' +
      '  - SUPABASE_SERVICE_ROLE_KEY\n' +
      'Check your .env.local file.\n\n' +
      'Example .env.local:\n' +
      '  SUPABASE_URL=https://your-project.supabase.co\n' +
      '  SUPABASE_SERVICE_ROLE_KEY=your-service-role-key'
    );
  }

  if (typeof window !== 'undefined') {
    throw new Error(
      '🚨 SECURITY ERROR: createAdminClient() called in browser context!'
    );
  }

  return createClient<Database>(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    realtime: {
      params: {
        eventsPerSecond: -1,
      },
    },
  });
}

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type AdminClient = ReturnType<typeof getAdminClient>;

// ============================================================================
// UTILITIES FOR SCRIPTS
// ============================================================================

/**
 * Test admin connection and privileges
 * Useful for verifying setup in scripts
 * 
 * @example
 * ```typescript
 * import { testAdminConnection } from '@/lib/supabase-admin';
 * 
 * async function main() {
 *   const { success, error } = await testAdminConnection();
 *   if (!success) {
 *     console.error('Admin connection failed:', error);
 *     process.exit(1);
 *   }
 *   console.log('✅ Admin connection successful');
 * }
 * ```
 */
export async function testAdminConnection(): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const supabase = getAdminClient();
    
    // Try a simple query
    const { error } = await supabase
      .from('code_sections')
      .select('id')
      .limit(1);
    
    if (error) {
      return { success: false, error: error.message };
    }
    
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}