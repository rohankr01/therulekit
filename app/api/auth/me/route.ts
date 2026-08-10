import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, headersWithSupabaseCookies } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const requestId = crypto.randomUUID();

  console.info('[auth-debug]', '/api/auth/me request', {
    requestId,
    method: req.method,
    hasCookie: Boolean(req.headers.get('cookie')),
    time: new Date().toISOString(),
  });

  try {
    const res = NextResponse.json({ user: null });
    const supabase = createServerClient({ req, res });

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    console.info('[auth-debug]', '/api/auth/me getUser response', {
      requestId,
      ok: !error,
      hasUser: Boolean(user),
      errorMessage: error?.message,
      time: new Date().toISOString(),
    });

    if (error) {
      console.warn('[auth-debug]', '/api/auth/me returning 401', {
        requestId,
        errorMessage: error.message,
        time: new Date().toISOString(),
      });

      return NextResponse.json(
        { user: null, error: error.message },
        { status: 401, headers: headersWithSupabaseCookies(res) }
      );
    }

    if (!user) {
      console.info('[auth-debug]', '/api/auth/me returning anonymous 200', {
        requestId,
        time: new Date().toISOString(),
      });

      return NextResponse.json(
        { user: null },
        { status: 200, headers: headersWithSupabaseCookies(res) }
      );
    }

    console.info('[auth-debug]', '/api/auth/me returning authenticated 200', {
      requestId,
      userId: user.id,
      time: new Date().toISOString(),
    });

    return NextResponse.json(
      {
        user: {
          id: user.id,
          email: user.email,
          created_at: user.created_at,
        },
        authenticated: true,
      },
      { status: 200, headers: headersWithSupabaseCookies(res) }
    );
  } catch (error: any) {
    console.error('[auth-debug]', '/api/auth/me returning 500', {
      requestId,
      errorMessage: error?.message,
      time: new Date().toISOString(),
    });

    return NextResponse.json(
      { user: null, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
