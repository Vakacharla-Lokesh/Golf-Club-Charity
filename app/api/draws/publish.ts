/**
 * Draw Publishing Endpoint
 * Creates draw entries snapshot and calculates all matches
 * Admin-only endpoint
 * 
 * NOTE: Prize calculation is done in a separate endpoint
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabase } from '@/lib/db';
import { getEmailFromJwt, isAdmin } from '@/lib/auth';
import { calculateMatches, getPrizeTier } from '@/lib/draw-engine';

// Input validation
const publishSchema = z.object({
  drawId: z.string().uuid('Invalid draw ID'),
});

interface PublishResponse {
  success: boolean;
  draw: {
    id: string;
    status: string;
    winning_numbers: number[];
  };
  entriesCreated: number;
  resultsCreated: number;
  winnersByTier: {
    tier5: number;
    tier4: number;
    tier3: number;
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
    const { drawId } = publishSchema.parse(body);

    // 3. FETCH DRAW (must be simulated)
    const { data: draw, error: drawError } = await supabase
      .from('draws')
      .select('*')
      .eq('id', drawId)
      .single();

    if (drawError || !draw) {
      return NextResponse.json({ error: 'Draw not found' }, { status: 404 });
    }

    if (draw.status !== 'simulated') {
      return NextResponse.json(
        { error: `Draw must be in 'simulated' status, current: '${draw.status}'` },
        { status: 400 }
      );
    }

    if (!draw.winning_numbers || draw.winning_numbers.length !== 5) {
      return NextResponse.json(
        { error: 'Draw has no winning numbers. Simulate first.' },
        { status: 400 }
      );
    }

    // 4. FETCH ALL ACTIVE SUBSCRIBERS
    const { data: subscribers, error: subscriberError } = await supabase
      .from('profiles')
      .select(
        `
        id,
        auth_user_id,
        full_name,
        golf_scores (id, score, played_at)
      `
      )
      .eq('subscription_status', 'active');

    if (subscriberError) {
      console.error('Error fetching subscribers:', subscriberError);
      return NextResponse.json({ error: 'Failed to fetch subscribers' }, { status: 500 });
    }

    if (!subscribers || subscribers.length === 0) {
      return NextResponse.json(
        { error: 'No active subscribers found' },
        { status: 400 }
      );
    }

    // 5. CREATE DRAW ENTRIES SNAPSHOT & COLLECT RESULTS
    interface DrawEntryRecord {
      draw_id: string;
      user_id: string;
      scores: number[];
    }

    interface DrawResultRecord {
      draw_id: string;
      user_id: string;
      match_type: 3 | 4 | 5;
      prize_amount: number;
      payment_status: 'pending' | 'paid';
      proof_url: string | null;
    }

    const drawEntriesData: DrawEntryRecord[] = [];
    const drawResultsData: DrawResultRecord[] = [];
    const winnersByTier = { tier5: 0, tier4: 0, tier3: 0 };

    for (const subscriber of subscribers) {
      // Get most recent 5 scores, sorted by played_at DESC
      interface GolfScore {
        played_at: string;
        score: number;
      }
      const scores = (subscriber.golf_scores as GolfScore[] | undefined)
        ?.sort((a, b) => new Date(b.played_at).getTime() - new Date(a.played_at).getTime())
      ?.slice(0, 5)
        ?.map((s) => s.score) || [];

      // Create draw entry snapshot (even if 0 scores)
      drawEntriesData.push({
        draw_id: drawId,
        user_id: subscriber.id,
        scores: scores,
      });

      // Calculate matches and create result only if 3+ scores
      if (scores.length >= 3) {
        const matchCount = calculateMatches(scores, draw.winning_numbers);
        const prizeTier = getPrizeTier(matchCount);

        if (prizeTier > 0) {
          drawResultsData.push({
            draw_id: drawId,
            user_id: subscriber.id,
            match_type: prizeTier as 3 | 4 | 5,
            prize_amount: 0,
            payment_status: 'pending',
            proof_url: null,
          });

          // Track winners
          if (prizeTier === 5) winnersByTier.tier5++;
          if (prizeTier === 4) winnersByTier.tier4++;
          if (prizeTier === 3) winnersByTier.tier3++;
        }
      }
    }

    // 6. BATCH INSERT DRAW ENTRIES
    let entriesCreated = 0;
    if (drawEntriesData.length > 0) {
      const { error: entriesError } = await supabase
        .from('draw_entries')
        .insert(drawEntriesData);

      if (entriesError) {
        console.error('Error creating draw entries:', entriesError);
        return NextResponse.json(
          { error: 'Failed to create draw entries', details: entriesError.message },
          { status: 500 }
        );
      }
      entriesCreated = drawEntriesData.length;
    }

    // 7. BATCH INSERT DRAW RESULTS
    let resultsCreated = 0;
    if (drawResultsData.length > 0) {
      const { error: resultsError } = await supabase
        .from('draw_results')
        .insert(drawResultsData);

      if (resultsError) {
        console.error('Error creating draw results:', resultsError);
        return NextResponse.json(
          { error: 'Failed to create draw results', details: resultsError.message },
          { status: 500 }
        );
      }
      resultsCreated = drawResultsData.length;
    }

    // 8. UPDATE DRAW STATUS TO PUBLISHED
    const { data: publishedDraw, error: publishError } = await supabase
      .from('draws')
      .update({
        status: 'published',
      })
      .eq('id', drawId)
      .select()
      .single();

    if (publishError || !publishedDraw) {
      console.error('Error publishing draw:', publishError);
      return NextResponse.json({ error: 'Failed to publish draw' }, { status: 500 });
    }

    // 9. RETURN SUCCESS RESPONSE
    const response: PublishResponse = {
      success: true,
      draw: {
        id: publishedDraw.id,
        status: publishedDraw.status,
        winning_numbers: publishedDraw.winning_numbers,
      },
      entriesCreated,
      resultsCreated,
      winnersByTier,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 });
    }

    console.error('Draw publish error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
