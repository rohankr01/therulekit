'use client';

import { AuthProvider } from '@/hooks/use-auth';
import { Toaster } from 'sonner';

/**
 * ✅ Providers Component
 * 
 * This wraps all client-side providers in the correct order:
 * 1. AuthProvider - initializes Supabase and user state
 * 2. Toaster - displays notifications
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      {/* 🔥 CRITICAL: Auth sync listener ensures PKCE flow completes */}
      {/* Toast notifications */}
      <Toaster position="top-center" richColors theme="light" />

      {children}
    </AuthProvider>
  );
}
