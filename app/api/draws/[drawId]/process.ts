import { NextRequest, NextResponse } from 'next/server';
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { isAdmin } from '@/lib/auth';
import { PRIZE_SPLIT } from '@/lib/constants';

/**
 * POST /api/draws/[drawId]/process
 * Admin only. Processes a simulated draw:
 * 1. Creates draw_entries for all active users (captures their current scores)
 * 2. Calculates matches between scores and winning numbers
 * 3. Creates draw_results for winners
 * 4. Calculates prize_pools
 *
 * Idempotent: safe to call multiple times (replaces existing entries/results)
 */

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ drawId: string }> }
) {
  try {
    const { drawId } = await params;

    // Get authenticated admin user
    const res = NextResponse.next();
    const supabase = createMiddlewareClient({ req: request, res });

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || !isAdmin(user.email || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch draw (must be simulated)
    const { data: draw, error: drawError } = await supabase
      .from('draws')
      .select('*')
      .eq('id', drawId)
      .single();

    if (drawError || !draw) {
      return NextResponse.json({ error: 'Draw not found' }, { status: 404 });
    }

    if (draw.status !== 'simulated' || !draw.winning_numbers) {
      return NextResponse.json(
        { error: 'Draw must be simulated with winning numbers first' },
        { status: 400 }
      );
    }

    const winningNumbers = draw.winning_numbers as number[];

    // Step 1: Delete existing entries/results for idempotency
    await supabase.from('draw_entries').delete().eq('draw_id', drawId);
    await supabase.from('draw_results').delete().eq('draw_id', drawId);
    await supabase.from('prize_pools').delete().eq('draw_id', drawId);

    // Step 2: Fetch all active users' latest scores
    const { data: userScores } = await supabase.from('golf_scores').select(
      `
      user_id,
      score,
      profiles(id)
    `
    );

    interface UserScoresGrouped {
      [userId: string]: number[];
    }

    // Group scores by user, keep up to 5 most recent
    const userScoresMap: UserScoresGrouped = {};
    (userScores || []).forEach((record: any) => {
      const userId = record.user_id;
      if (!userScoresMap[userId]) {
        userScoresMap[userId] = [];
      }
      if (userScoresMap[userId].length < 5) {
        userScoresMap[userId].push(record.score);
      }
    });

    // Step 3: Create draw_entries and track results
    const drawEntryResults = [];

    for (const [userId, scores] of Object.entries(userScoresMap)) {
      if (scores.length < 3) continue; // Skip users with fewer than 3 scores

      // Create draw entry
      const { error: entryError } = await supabase.from('draw_entries').insert({
        draw_id: drawId,
        user_id: userId,
        scores,
      });

      if (entryError) {
        console.error(`Error creating entry for user ${userId}:`, entryError);
        continue;
      }

      // Calculate matches
      const matches = scores.filter((score) => winningNumbers.includes(score)).length;

      // Only winners (3+ matches) get results
      if (matches >= 3) {
        drawEntryResults.push({
          draw_id: drawId,
          user_id: userId,
          match_type: matches,
        });
      }
    }

    // Step 4: Calculate prize pool (distributed evenly among winners per tier)
    // For MVP, using equal distribution within each tier
    const tier5Count = drawEntryResults.filter((r) => r.match_type === 5).length;
    const tier4Count = drawEntryResults.filter((r) => r.match_type === 4).length;
    const tier3Count = drawEntryResults.filter((r) => r.match_type === 3).length;

    // Assuming total pool = ₹10,000 for testing
    const totalPool = 10000;
    const tier5Pool = totalPool * PRIZE_SPLIT.tier5;
    const tier4Pool = totalPool * PRIZE_SPLIT.tier4;
    const tier3Pool = totalPool * PRIZE_SPLIT.tier3;

    const tier5PrizePerWinner = tier5Count > 0 ? tier5Pool / tier5Count : 0;
    const tier4PrizePerWinner = tier4Count > 0 ? tier4Pool / tier4Count : 0;
    const tier3PrizePerWinner = tier3Count > 0 ? tier3Pool / tier3Count : 0;

    // Step 5: Create draw_results with calculated prizes
    const resultsToInsert = drawEntryResults.map((result) => {
      let prizeAmount = 0;

      if (result.match_type === 5) {
        prizeAmount = tier5PrizePerWinner;
      } else if (result.match_type === 4) {
        prizeAmount = tier4PrizePerWinner;
      } else if (result.match_type === 3) {
        prizeAmount = tier3PrizePerWinner;
      }

      return {
        draw_id: drawId,
        user_id: result.user_id,
        match_type: result.match_type,
        prize_amount: prizeAmount,
      };
    });

    const { error: resultsError } = await supabase
      .from('draw_results')
      .insert(resultsToInsert);

    if (resultsError) {
      return NextResponse.json(
        { error: 'Failed to create results: ' + resultsError.message },
        { status: 500 }
      );
    }

    // Step 6: Create prize_pools record
    const { error: poolError } = await supabase.from('prize_pools').insert({
      draw_id: drawId,
      tier_5: tier5Pool,
      tier_4: tier4Pool,
      tier_3: tier3Pool,
    });

    if (poolError) {
      return NextResponse.json(
        { error: 'Failed to create prize pool: ' + poolError.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        drawnEntries: Object.keys(userScoresMap).length,
        winners: drawEntryResults.length,
        tier5Winners: tier5Count,
        tier4Winners: tier4Count,
        tier3Winners: tier3Count,
        totalPrizePool: totalPool,
        tier5Pool,
        tier4Pool,
        tier3Pool,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error processing draw:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
