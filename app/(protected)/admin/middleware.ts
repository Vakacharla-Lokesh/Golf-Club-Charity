import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextRequest, NextResponse } from 'next/server';
import { isAdmin } from '@/lib/auth';

async function AdminMiddleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // Check admin status
  const adminStatus = isAdmin(user.email || '');
  if (!adminStatus) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  return res;
}

export default AdminMiddleware;
