/**
 * Reject Draw Result Endpoint
 * Admin marks a winner's result as rejected (not eligible/invalid)
 * NOTE: Simplified for MVP - schema only supports 'pending' | 'paid' states
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getEmailFromJwt, isAdmin } from '@/lib/auth';

const rejectSchema = z.object({
  resultId: z.string().uuid('Invalid result ID'),
});

export async function POST(request: NextRequest) {
  try {
    // 1. AUTHENTICATE
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing authorization header' }, { status: 401 });
    }

    const jwt = authHeader.slice(7);
    const email = getEmailFromJwt(jwt);

    if (!email || !isAdmin(email)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // 2. VALIDATE INPUT
    const body = await request.json();
    rejectSchema.parse(body);

    // 3. REJECTION NOT SUPPORTED IN MVP
    return NextResponse.json(
      { error: 'Rejection workflow not available in MVP. Please keep result as pending or mark as paid.' },
      { status: 400 }
    );
  } catch (err) {
    console.error('Error rejecting result:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
