'use client';

import { createContext, useContext, useEffect, useState, useMemo, ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import { getBrowserClient } from '@/lib/supabase';

type SupabaseClient = ReturnType<typeof getBrowserClient>;

interface AuthContextType {
  user: User | null;
  supabase: SupabaseClient;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

let redirecting = false;
let authProviderMountCount = 0;

/**
 * AuthProvider - Client-side authentication context
 * 
 * ✅ FIXED: Removed unnecessary /api/auth/me calls
 * ✅ Server routes handle their own auth with getUser()
 * ✅ Client only manages Supabase client state
 * 
 * Features:
 * ✅ Uses getUser() for secure session validation
 * ✅ Memoized Supabase client (prevents re-subscriptions)
 * ✅ Automatic logout redirect
 * ✅ Production-ready logging
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  // ✅ Memoize Supabase client to prevent re-creation
  const supabase = useMemo(() => getBrowserClient(), []);
  
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    authProviderMountCount += 1;
    const mountId = authProviderMountCount;

    console.info('[auth-debug]', 'AuthProvider mounted', {
      mountId,
      time: new Date().toISOString(),
    });

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // STEP 1: Get initial session on mount
    // ✅ Use getUser() for secure session validation
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    
    supabase.auth.getUser().then(({ data, error }) => {
      if (!mounted) return;

      console.info('[auth-debug]', 'initial getUser response', {
        mountId,
        ok: !error,
        hasUser: Boolean(data.user),
        errorMessage: error?.message,
        time: new Date().toISOString(),
      });

      if (error) {
        if (process.env.NODE_ENV !== 'production') {
          console.warn('⚠️ Initial auth check failed:', error.message);
        }
        setUser(null);
        setLoading(false);
        return;
      }

      setUser(data.user ?? null);
      setLoading(false);

      if (data.user && process.env.NODE_ENV !== 'production') {
        console.log('✅ User authenticated:', data.user.email);
      }
    });

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // STEP 2: Listen for auth state changes
    // ✅ FIXED: No /api/auth/me calls - server routes handle their own auth
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return;

        console.info('[auth-debug]', 'auth state event', {
          mountId,
          event,
          hasSession: Boolean(session),
          hasUser: Boolean(session?.user),
          time: new Date().toISOString(),
        });

        if (process.env.NODE_ENV !== 'production') {
          console.log(`🔄 Auth event: ${event}`);
        }

        // ✅ Simply update user state - no server sync needed
        setUser(session?.user ?? null);

        // ✅ Only redirect on explicit logout
        if (event === 'SIGNED_OUT') {
          if (!redirecting && window.location.pathname !== '/') {
            redirecting = true;

            if (process.env.NODE_ENV !== 'production') {
              console.log('📤 Logging out - redirecting to home');
            }

            setTimeout(() => {
              window.location.replace('/');
            }, 100);
          }
        }
      }
    );

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // CLEANUP
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    
    return () => {
      mounted = false;
      console.info('[auth-debug]', 'AuthProvider unmounted', {
        mountId,
        time: new Date().toISOString(),
      });
      subscription?.unsubscribe();
      redirecting = false;
    };
  }, [supabase]);

  const value = { user, supabase, loading };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * useAuth - Hook to access authentication context
 * 
 * @throws Error if used outside AuthProvider
 * @returns AuthContextType with user, supabase client, and loading state
 * 
 * @example
 * const { user, supabase, loading } = useAuth();
 * 
 * if (loading) return <Spinner />;
 * if (!user) return <LoginButton />;
 * return <Dashboard user={user} />;
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
