import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ success: true });

  // Clear session cookies
  response.cookies.set({
    name: 'sb-access-token',
    value: '',
    httpOnly: true,
    maxAge: 0,
    path: '/',
  });

  response.cookies.set({
    name: 'sb-refresh-token',
    value: '',
    httpOnly: true,
    maxAge: 0,
    path: '/',
  });

  response.cookies.set({
    name: 'sb-expires-at',
    value: '',
    httpOnly: true,
    maxAge: 0,
    path: '/',
  });

  return response;
}
