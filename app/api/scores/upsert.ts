import { NextRequest, NextResponse } from 'next/server';
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { supabase } from '@/lib/db';
import { scoreSchema } from '@/lib/validators';
import { GolfScore } from '@/lib/types';
import { MAX_SCORES_PER_USER } from '@/lib/constants';
import { z } from 'zod';

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const authSupabase = createMiddlewareClient({
      req: request,
      res: NextResponse.next(),
    });
    const {
      data: { session },
    } = await authSupabase.auth.getSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Validate input
    const body = await request.json();
    const validated = scoreSchema.parse(body);

    // Fetch current scores for user (ordered by played_at ascending, so oldest first)
    const { data: currentScores, error: fetchError } = await supabase
      .from('golf_scores')
      .select('*')
      .eq('user_id', userId)
      .order('played_at', { ascending: true });

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    const scoresToDelete: GolfScore[] = currentScores || [];

    // If we already have 5 scores, delete the oldest
    if (scoresToDelete.length >= MAX_SCORES_PER_USER) {
      const oldestScore = scoresToDelete[0];
      const { error: deleteError } = await supabase
        .from('golf_scores')
        .delete()
        .eq('id', oldestScore.id);

      if (deleteError) {
        return NextResponse.json({ error: deleteError.message }, { status: 500 });
      }
    }

    // Insert new score
    const { data: newScore, error: insertError } = await supabase
      .from('golf_scores')
      .insert({
        user_id: userId,
        score: validated.score,
        played_at: validated.playedAt.split('T')[0], // Extract date part
      })
      .select();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    // Fetch updated scores list (reverse chronological)
    const { data: updatedScores, error: finalFetchError } = await supabase
      .from('golf_scores')
      .select('*')
      .eq('user_id', userId)
      .order('played_at', { ascending: false });

    if (finalFetchError) {
      return NextResponse.json({ error: finalFetchError.message }, { status: 500 });
    }

    return NextResponse.json(
      {
        success: true,
        score: newScore?.[0],
        scores: updatedScores || [],
        count: (updatedScores || []).length,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
