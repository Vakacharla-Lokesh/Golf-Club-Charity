/**
 * Save Simulation Endpoint
 * Saves simulation results to DB with status "simulated"
 * Admin-only endpoint
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabase } from '@/lib/db';
import { getEmailFromJwt, isAdmin } from '@/lib/auth';

// Input validation
const saveSimSchema = z.object({
  drawId: z.string().uuid('Invalid draw ID'),
  winningNumbers: z.array(z.number().int().min(1).max(45)).length(5),
});

interface SaveSimResponse {
  success: boolean;
  draw: {
    id: string;
    status: string;
    winning_numbers: number[];
    draw_date: string;
  };
}

export async function POST(request: NextRequest): Promise<NextResponse> {
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
    const { drawId, winningNumbers } = saveSimSchema.parse(body);

    // 3. FETCH CURRENT DRAW
    const { data: draw, error: fetchError } = await supabase
      .from('draws')
      .select('*')
      .eq('id', drawId)
      .single();

    if (fetchError || !draw) {
      return NextResponse.json({ error: 'Draw not found' }, { status: 404 });
    }

    // Verify draw is in draft or already simulated (allows re-simulation)
    if (!['draft', 'simulated'].includes(draw.status)) {
      return NextResponse.json(
        { error: `Cannot simulate draw with status '${draw.status}'` },
        { status: 400 }
      );
    }

    // 4. UPDATE DRAW STATUS
    const { data: updated, error: updateError } = await supabase
      .from('draws')
      .update({
        status: 'simulated',
        winning_numbers: winningNumbers,
      })
      .eq('id', drawId)
      .select()
      .single();

    if (updateError || !updated) {
      console.error('Error updating draw:', updateError);
      return NextResponse.json({ error: 'Failed to save simulation' }, { status: 500 });
    }

    const response: SaveSimResponse = {
      success: true,
      draw: {
        id: updated.id,
        status: updated.status,
        winning_numbers: updated.winning_numbers,
        draw_date: updated.draw_date,
      },
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 });
    }

    console.error('Save simulation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
