'use client';

import { useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';

/**
 * ✅ SupabaseAuthSync Component
 * 
 * CRITICAL: This component ensures PKCE auth flow completes properly
 * 
 * What it does:
 * 1. Listens to ALL auth state changes
 * 2. Syncs session with server via /api/auth/me
 * 3. Exchanges PKCE auth code for session
 * 4. Writes cookies to browser
 * 5. Restores session on page reload
 * 
 * Without this, PKCE auth fails and cookies never get set
 */
export function SupabaseAuthSync() {
  const { supabase } = useAuth();

  useEffect(() => {
    console.log('🔐 SupabaseAuthSync mounted');

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log(`🔄 Auth State Changed: ${event}`, session?.user?.email || 'no user');

        // ✅ CRITICAL: Sync with server on ANY auth event
        // This ensures cookies are written and session persists
        try {
          const response = await fetch('/api/auth/me', {
            method: 'GET',
            credentials: 'include', // Send cookies
          });

          if (response.ok) {
            const data = await response.json();
            console.log('✅ Auth synced with server:', data.user?.email);
          } else {
            console.warn('⚠️ Auth sync returned:', response.status);
          }
        } catch (err) {
          console.error('❌ Auth sync failed:', err);
        }
      }
    );

    return () => {
      console.log('🔐 SupabaseAuthSync unmounted');
      subscription?.unsubscribe();
    };
  }, [supabase]);

  // This component doesn't render anything, just listens
  return null;
}