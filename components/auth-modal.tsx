'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'sonner';

const CloseIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

interface AuthModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function AuthModal({ onClose, onSuccess }: AuthModalProps) {
  const { supabase } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldownUntil, setCooldownUntil] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [requestInFlight, setRequestInFlight] = useState(false);
  const submitLockRef = useRef(false);
  const lastSubmitAtRef = useRef(0);
  const requestIdRef = useRef(0);

  const cooldownRemaining = useMemo(() => {
    if (!cooldownUntil) return 0;
    return Math.max(0, Math.ceil((cooldownUntil - now) / 1000));
  }, [cooldownUntil, now]);

  useEffect(() => {
    if (!cooldownUntil) return;

    const timer = window.setInterval(() => {
      const current = Date.now();
      setNow(current);
      if (current >= cooldownUntil) {
        setCooldownUntil(null);
      }
    }, 1000);

    return () => window.clearInterval(timer);
  }, [cooldownUntil]);

  const getCooldownSeconds = (message: string) => {
    const match = message.match(/(\d+)\s*seconds?/i);
    if (!match) return null;
    return Number(match[1]);
  };

  const maskEmail = (value: string) => {
    const [name, domain] = value.trim().toLowerCase().split('@');
    if (!name || !domain) return 'invalid-email';
    return `${name.slice(0, 2)}***@${domain}`;
  };

  const logAuthDebug = (message: string, details?: Record<string, unknown>) => {
    console.info('[auth-debug]', message, {
      ...details,
      time: new Date().toISOString(),
    });
  };

  const syncSessionWithServer = async () => {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const { data } = await supabase.auth.getSession();

      if (!data.session) {
        logAuthDebug('session-sync skipped: no client session', { attempt });
        return false;
      }

      logAuthDebug('session-sync request: /api/auth/me', { attempt });
      const response = await fetch('/api/auth/me', {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store',
      });

      logAuthDebug('session-sync response: /api/auth/me', {
        attempt,
        status: response.status,
        ok: response.ok,
      });

      if (response.ok) {
        return true;
      }

      await new Promise((resolve) => window.setTimeout(resolve, 250 * (attempt + 1)));
    }

    return false;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const nowMs = Date.now();

    if (submitLockRef.current || loading || requestInFlight || cooldownRemaining > 0) {
      logAuthDebug('blocked duplicate auth submit', {
        mode: isLogin ? 'signin' : 'signup',
        locked: submitLockRef.current,
        loading,
        requestInFlight,
        cooldownRemaining,
      });
      return;
    }

    if (nowMs - lastSubmitAtRef.current < 1200) {
      logAuthDebug('debounced auth submit', {
        mode: isLogin ? 'signin' : 'signup',
        msSinceLastSubmit: nowMs - lastSubmitAtRef.current,
      });
      return;
    }

    setError(null);

    if (!isLogin && !agreedToTerms) {
      const errorMsg = 'Please agree to the Terms of Service and Privacy Policy';
      setError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    submitLockRef.current = true;
    lastSubmitAtRef.current = nowMs;
    requestIdRef.current += 1;
    const requestId = requestIdRef.current;

    setRequestInFlight(true);
    setLoading(true);

    logAuthDebug('auth submit started', {
      requestId,
      mode: isLogin ? 'signin' : 'signup',
      email: maskEmail(email),
    });

    try {
      if (isLogin) {
        logAuthDebug('supabase.auth.signInWithPassword request', {
          requestId,
          email: maskEmail(email),
        });

        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        logAuthDebug('supabase.auth.signInWithPassword response', {
          requestId,
          ok: !signInError,
          errorName: signInError?.name,
          errorStatus: signInError?.status,
          errorMessage: signInError?.message,
        });

        if (signInError) throw signInError;

        const synced = await syncSessionWithServer();
        if (!synced && process.env.NODE_ENV !== 'production') {
          console.warn('Session sync check did not complete before UI success');
        }

        toast.success('Signed in successfully!');
        onSuccess();
      } else {
        logAuthDebug('supabase.auth.signUp request', {
          requestId,
          email: maskEmail(email),
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        });

        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });

        logAuthDebug('supabase.auth.signUp response', {
          requestId,
          ok: !signUpError,
          hasUser: Boolean(signUpData?.user),
          hasSession: Boolean(signUpData?.session),
          identitiesCount: signUpData?.user?.identities?.length,
          errorName: signUpError?.name,
          errorStatus: signUpError?.status,
          errorMessage: signUpError?.message,
        });

        if (signUpError) throw signUpError;

        if (!signUpData.session) {
          toast.success('Check your email to complete sign in.');
          onClose();
          return;
        }

        await syncSessionWithServer();
        toast.success('Account created! You can now use 25 free questions.');
        onSuccess();
      }
    } catch (err: any) {
      const errorMsg = err.message || 'An unknown error occurred.';
      const cooldownSeconds = getCooldownSeconds(errorMsg);

      logAuthDebug('auth submit failed', {
        requestId,
        mode: isLogin ? 'signin' : 'signup',
        errorName: err?.name,
        errorStatus: err?.status,
        errorMessage: errorMsg,
        cooldownSeconds,
      });

      if (cooldownSeconds && cooldownSeconds > 0) {
        setCooldownUntil(Date.now() + cooldownSeconds * 1000);
      }

      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      logAuthDebug('auth submit finished', {
        requestId,
        mode: isLogin ? 'signin' : 'signup',
      });
      submitLockRef.current = false;
      setRequestInFlight(false);
      setLoading(false);
    }
  };

  const submitDisabled =
    loading || requestInFlight || cooldownRemaining > 0 || (!isLogin && !agreedToTerms);

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 sm:p-8 relative max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Close"
        >
          <CloseIcon />
        </button>

        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white text-3xl font-bold mx-auto mb-4 shadow-lg">
            E
          </div>
          <h2 className="text-2xl font-bold text-gray-900">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h2>
          <p className="text-gray-600 mt-2">
            {isLogin ? 'Sign in to access your chat history.' : 'Get free beta questions'}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm mb-4 text-center">
            {error}
          </div>
        )}

        {cooldownRemaining > 0 && (
          <div className="bg-amber-50 text-amber-800 p-3 rounded-lg text-sm mb-4 text-center">
            For security, please wait {cooldownRemaining}s before trying again.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading || requestInFlight}
              autoComplete="email"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-gray-100"
              placeholder="your@email.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              disabled={loading || requestInFlight}
              autoComplete={isLogin ? 'current-password' : 'new-password'}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-gray-100"
              placeholder="Password"
            />
          </div>

          {!isLogin && (
            <div className="flex items-start gap-3 py-2">
              <input
                id="terms"
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                disabled={loading || requestInFlight}
                className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:bg-gray-100"
              />
              <label htmlFor="terms" className="text-sm text-gray-700">
                I agree to the{' '}
                <a
                  href="/terms"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-700 font-medium underline"
                >
                  Terms of Service
                </a>{' '}
                and{' '}
                <a
                  href="/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-700 font-medium underline"
                >
                  Privacy Policy
                </a>
              </label>
            </div>
          )}

          <button
            type="submit"
            disabled={submitDisabled}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 rounded-lg transition-all shadow-lg hover:shadow-xl disabled:cursor-not-allowed"
          >
            {loading
              ? isLogin
                ? 'Signing in...'
                : 'Creating account...'
              : cooldownRemaining > 0
              ? `Try again in ${cooldownRemaining}s`
              : isLogin
              ? 'Sign In'
              : 'Create Account'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError(null);
            }}
            disabled={loading || requestInFlight}
            className="text-sm text-gray-600 hover:text-gray-900 transition-colors disabled:text-gray-400"
          >
            {isLogin ? (
              <>
                Don&apos;t have an account?{' '}
                <span className="text-blue-600 font-semibold">Sign up</span>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <span className="text-blue-600 font-semibold">Sign in</span>
              </>
            )}
          </button>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-xs text-center text-gray-500">
            Your data is secure and never shared. Free beta access included.
          </p>
        </div>
      </div>
    </div>
  );
}
