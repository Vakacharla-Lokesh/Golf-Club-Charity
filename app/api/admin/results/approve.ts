/**
 * Approve Draw Result Endpoint
 * Admin verifies proof and marks winner as paid
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabase } from '@/lib/db';
import { getEmailFromJwt, isAdmin } from '@/lib/auth';

const approveSchema = z.object({
  resultId: z.string().uuid('Invalid result ID'),
  proofUrl: z.string().url('Invalid proof URL'),
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
    const { resultId, proofUrl } = approveSchema.parse(body);

    // 3. UPDATE RESULT - Mark as paid with proof
    const { data: result, error: updateError } = await supabase
      .from('draw_results')
      .update({
        payment_status: 'paid',
        proof_url: proofUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', resultId)
      .select()
      .single();

    if (updateError || !result) {
      console.error('Error approving result:', updateError);
      return NextResponse.json({ error: 'Failed to approve result' }, { status: 500 });
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

    console.error('Approve result error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
