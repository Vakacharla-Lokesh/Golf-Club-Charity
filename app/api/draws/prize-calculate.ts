/**
 * Prize Calculation Endpoint
 * Calculates prize pools based on subscriber count and distribution
 * Handles jackpot rollover logic
 * Admin-only endpoint
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabase } from '@/lib/db';
import { getEmailFromJwt, isAdmin } from '@/lib/auth';
import { PRIZE_SPLIT, STRIPE_AMOUNT_MONTHLY, STRIPE_AMOUNT_YEARLY } from '@/lib/constants';

// Input validation
const prizeCalculateSchema = z.object({
  drawId: z.string().uuid('Invalid draw ID'),
  totalPoolOverride: z.number().positive().optional(), // For testing
});

interface PrizeDistribution {
  tier5: { count: number; perWinner: number; total: number };
  tier4: { count: number; perWinner: number; total: number };
  tier3: { count: number; perWinner: number; total: number };
}

interface PrizeCalculateResponse {
  success: boolean;
  draw: {
    id: string;
    status: string;
  };
  prizePool: {
    totalPool: number;
    jackpotRollover: number;
    tier5Total: number;
    tier4Total: number;
    tier3Total: number;
  };
  distribution: PrizeDistribution;
  resultsUpdated: number;
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
    const { drawId, totalPoolOverride } = prizeCalculateSchema.parse(body);

    // 3. FETCH DRAW (must be published)
    const { data: draw, error: drawError } = await supabase
      .from('draws')
      .select('*')
      .eq('id', drawId)
      .single();

    if (drawError || !draw) {
      return NextResponse.json({ error: 'Draw not found' }, { status: 404 });
    }

    if (draw.status !== 'published') {
      return NextResponse.json(
        { error: `Draw must be in 'published' status, current: '${draw.status}'` },
        { status: 400 }
      );
    }

    // 4. CALCULATE TOTAL PRIZE POOL
    let totalPool = totalPoolOverride || 0;

    if (!totalPoolOverride) {
      // Fetch all active subscriptions to calculate total pool
      const { data: subscriptions, error: subError } = await supabase
        .from('subscriptions')
        .select('plan')
        .eq('status', 'active');

      if (subError) {
        console.error('Error fetching subscriptions:', subError);
        return NextResponse.json(
          { error: 'Failed to calculate prize pool' },
          { status: 500 }
        );
      }

      // Sum up amounts by plan type
      if (subscriptions && subscriptions.length > 0) {
        for (const sub of subscriptions) {
          if (sub.plan === 'monthly') {
            totalPool += STRIPE_AMOUNT_MONTHLY;
          } else if (sub.plan === 'yearly') {
            totalPool += STRIPE_AMOUNT_YEARLY;
          }
        }
      }
    }

    if (totalPool === 0) {
      return NextResponse.json(
        { error: 'No active subscriptions. Cannot calculate prize pool.' },
        { status: 400 }
      );
    }

    // 5. FETCH DRAW RESULTS grouped by tier
    const { data: results, error: resultsError } = await supabase
      .from('draw_results')
      .select('*')
      .eq('draw_id', drawId);

    if (resultsError) {
      console.error('Error fetching draw results:', resultsError);
      return NextResponse.json(
        { error: 'Failed to fetch draw results' },
        { status: 500 }
      );
    }

    // Count winners by tier
    const tier5Winners = results?.filter((r) => r.match_type === 5).length || 0;
    const tier4Winners = results?.filter((r) => r.match_type === 4).length || 0;
    const tier3Winners = results?.filter((r) => r.match_type === 3).length || 0;

    // 6. HANDLE JACKPOT ROLLOVER
    let jackpotRollover = 0;

    if (tier5Winners === 0) {
      // TODO: No tier-5 winners: query previous draw for unpaid tier-5 pool
      // For MVP, we skip rollover logic and start fresh each draw
      // Future: Query previous draw's prize_pools where tier_5 > 0 and has unpaid results
      jackpotRollover = 0;
    }

    // 7. ALLOCATE PRIZE POOL BY TIER
    const tier5Pool = totalPool * PRIZE_SPLIT.tier5 + jackpotRollover;
    const tier4Pool = totalPool * PRIZE_SPLIT.tier4;
    const tier3Pool = totalPool * PRIZE_SPLIT.tier3;

    // Calculate per-winner amounts
    const tier5PerWinner = tier5Winners > 0 ? tier5Pool / tier5Winners : 0;
    const tier4PerWinner = tier4Winners > 0 ? tier4Pool / tier4Winners : 0;
    const tier3PerWinner = tier3Winners > 0 ? tier3Pool / tier3Winners : 0;

    // 8. UPDATE DRAW_RESULTS WITH PRIZE AMOUNTS
    let resultsUpdated = 0;

    if (results && results.length > 0) {
      for (const result of results) {
        let prizeAmount = 0;

        if (result.match_type === 5) {
          prizeAmount = tier5PerWinner;
        } else if (result.match_type === 4) {
          prizeAmount = tier4PerWinner;
        } else if (result.match_type === 3) {
          prizeAmount = tier3PerWinner;
        }

        if (prizeAmount > 0) {
          const { error: updateError } = await supabase
            .from('draw_results')
            .update({ prize_amount: prizeAmount })
            .eq('id', result.id);

          if (updateError) {
            console.error(`Error updating prize for result ${result.id}:`, updateError);
            return NextResponse.json(
              { error: 'Failed to update prize amounts', details: updateError.message },
              { status: 500 }
            );
          }
          resultsUpdated++;
        }
      }
    }

    // 9. CREATE PRIZE_POOLS RECORD
    const { error: prizePoolError } = await supabase
      .from('prize_pools')
      .insert({
        draw_id: drawId,
        tier_5: tier5Pool,
        tier_4: tier4Pool,
        tier_3: tier3Pool,
        jackpot_rollover: jackpotRollover,
        total_pool: totalPool,
        created_at: new Date().toISOString(),
      });

    if (prizePoolError) {
      console.error('Error creating prize pool record:', prizePoolError);
      return NextResponse.json(
        { error: 'Failed to create prize pool record' },
        { status: 500 }
      );
    }

    // 10. RETURN RESPONSE
    const response: PrizeCalculateResponse = {
      success: true,
      draw: {
        id: draw.id,
        status: draw.status,
      },
      prizePool: {
        totalPool,
        jackpotRollover,
        tier5Total: tier5Pool,
        tier4Total: tier4Pool,
        tier3Total: tier3Pool,
      },
      distribution: {
        tier5: {
          count: tier5Winners,
          perWinner: tier5PerWinner,
          total: tier5Pool,
        },
        tier4: {
          count: tier4Winners,
          perWinner: tier4PerWinner,
          total: tier4Pool,
        },
        tier3: {
          count: tier3Winners,
          perWinner: tier3PerWinner,
          total: tier3Pool,
        },
      },
      resultsUpdated,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 });
    }

    console.error('Prize calculation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
