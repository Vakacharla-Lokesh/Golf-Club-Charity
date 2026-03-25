/**
 * Mark Result as Paid Endpoint
 * Admin marks a winner as paid (used if proof was already collected)
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabase } from '@/lib/db';
import { getEmailFromJwt, isAdmin } from '@/lib/auth';

const markPaidSchema = z.object({
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
    const { resultId } = markPaidSchema.parse(body);

    // 3. UPDATE RESULT
    const { data: result, error: updateError } = await supabase
      .from('draw_results')
      .update({
        payment_status: 'paid',
        updated_at: new Date().toISOString(),
      })
      .eq('id', resultId)
      .select()
      .single();

    if (updateError || !result) {
      console.error('Error marking result as paid:', updateError);
      return NextResponse.json({ error: 'Failed to mark result as paid' }, { status: 500 });
    }

    return NextResponse.json(
      { success: true, result },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Mark paid error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
