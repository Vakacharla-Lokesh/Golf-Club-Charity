import { NextRequest, NextResponse } from 'next/server';
import { isProduction } from '@/lib/env';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { access_token, refresh_token, expires_at } = body;

    if (!access_token || !refresh_token) {
      return NextResponse.json(
        { error: 'Missing session data' },
        { status: 400 }
      );
    }

    const response = NextResponse.json({ success: true });

    // Set secure HTTP-only cookies with session tokens
    response.cookies.set({
      name: 'sb-access-token',
      value: access_token,
      httpOnly: true,
      secure: isProduction(),
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365, // 1 year (token will expire before this)
      path: '/',
    });

    response.cookies.set({
      name: 'sb-refresh-token',
      value: refresh_token,
      httpOnly: true,
      secure: isProduction(),
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365,
      path: '/',
    });

    response.cookies.set({
      name: 'sb-expires-at',
      value: expires_at?.toString() || '',
      httpOnly: true,
      secure: isProduction(),
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Error setting session:', error);
    return NextResponse.json(
      { error: 'Failed to set session' },
      { status: 500 }
    );
  }
}
