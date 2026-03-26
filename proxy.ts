import { NextRequest, NextResponse } from 'next/server';
import { getEmailFromJwt, isAdmin } from '@/lib/auth';

export async function proxy(req: NextRequest) {
  const res = NextResponse.next();

  const accessToken = req.cookies.get('sb-access-token')?.value;
  const refreshToken = req.cookies.get('sb-refresh-token')?.value;
  const expiresAt = req.cookies.get('sb-expires-at')?.value;

  let session = null;

  if (accessToken && refreshToken) {
    session = {
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_at: expiresAt ? parseInt(expiresAt, 10) : undefined,
      user: null,
    };
  }

  if (req.nextUrl.pathname.startsWith('/dashboard') && !session) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  if (req.nextUrl.pathname.startsWith('/charities') && !session) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  if (req.nextUrl.pathname.startsWith('/admin')) {
    if (!session) {
      return NextResponse.redirect(new URL('/login', req.url));
    }

    const userEmail = getEmailFromJwt(accessToken);

    if (!isAdmin(userEmail || undefined)) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
  }

  if ((req.nextUrl.pathname === '/login' || req.nextUrl.pathname === '/signup') && session) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  return res;
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*', '/charities/:path*', '/login', '/signup'],
};
