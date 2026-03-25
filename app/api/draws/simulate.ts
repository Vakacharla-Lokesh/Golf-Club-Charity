/**
 * Draw Simulation Endpoint
 * Generates winning numbers and calculates matches WITHOUT saving
 * Admin-only endpoint
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabase } from '@/lib/db';
import { getEmailFromJwt } from '@/lib/auth';
import { isAdmin } from '@/lib/auth';
import { generateWinningNumbers, calculateMatches, getPrizeTier } from '@/lib/draw-engine';

// Input validation
const simulateSchema = z.object({
  drawId: z.string().uuid('Invalid draw ID'),
  drawType: z.enum(['random', 'algorithmic']),
});

interface MatchResult {
  userId: string;
  userEmail: string;
  fullName: string;
  scores: number[];
  matchCount: number;
  prizeTier: number;
}

interface SimulationResponse {
  success: boolean;
  winningNumbers: number[];
  totalSubscribers: number;
  matchesByTier: {
    tier5: MatchResult[];
    tier4: MatchResult[];
    tier3: MatchResult[];
    tier0: MatchResult[];
  };
  summary: {
    tier5Count: number;
    tier4Count: number;
    tier3Count: number;
    totalWinners: number;
  };
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // 1. AUTHENTICATE: Extract JWT and verify admin
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
    const { drawId, drawType } = simulateSchema.parse(body);

    // 3. FETCH DRAW
    const { data: draw, error: drawError } = await supabase
      .from('draws')
      .select('*')
      .eq('id', drawId)
      .single();

    if (drawError || !draw) {
      return NextResponse.json({ error: 'Draw not found' }, { status: 404 });
    }

    // Verify draw is in a valid state for simulation
    if (!['draft', 'simulated'].includes(draw.status)) {
      return NextResponse.json(
        { error: `Cannot simulate draw with status '${draw.status}'` },
        { status: 400 }
      );
    }

    // 4. GENERATE WINNING NUMBERS
    let winningNumbers: number[];
    if (drawType === 'random') {
      winningNumbers = generateWinningNumbers();
    } else {
      // TODO: Implement algorithmic draw (weighted by score frequency)
      // For now, fall back to random
      winningNumbers = generateWinningNumbers();
    }

    // 5. FETCH ALL ACTIVE SUBSCRIBERS AND THEIR SCORES
    const { data: subscribers, error: subscriberError } = await supabase
      .from('profiles')
      .select('id, auth_user_id, full_name')
      .eq('subscription_status', 'active');

    if (subscriberError) {
      console.error('Error fetching subscribers:', subscriberError);
      return NextResponse.json({ error: 'Failed to fetch subscribers' }, { status: 500 });
    }

    // 6. CALCULATE MATCHES FOR EACH SUBSCRIBER
    const matchesByTier: Record<number, MatchResult[]> = {
      5: [],
      4: [],
      3: [],
      0: [],
    };

    let totalWinners = 0;

    if (subscribers && subscribers.length > 0) {
      for (const subscriber of subscribers) {
        // Get user email from auth
        const { data: authUser } = await supabase.auth.admin.getUserById(
          subscriber.auth_user_id
        );

        const userEmail = authUser?.user?.email || 'unknown@example.com';

        // Fetch user's scores
        const { data: userScores } = await supabase
          .from('golf_scores')
          .select('score, played_at')
          .eq('user_id', subscriber.id)
          .order('played_at', { ascending: false })
          .limit(5);

        // Get only the 5 most recent scores
        const scores = userScores?.map((s) => s.score) || [];

        // Skip if user has fewer than 3 scores (can't win with fewer matches)
        if (scores.length < 3) continue;

        // Calculate matches
        const matchCount = calculateMatches(scores, winningNumbers);
        const prizeTier = getPrizeTier(matchCount);

        if (matchCount >= 3) {
          totalWinners++;
        }

        const result: MatchResult = {
          userId: subscriber.id,
          userEmail,
          fullName: subscriber.full_name,
          scores,
          matchCount,
          prizeTier,
        };

        matchesByTier[prizeTier].push(result);
      }
    }

    // 7. RETURN SIMULATION (NO SAVE)
    const response: SimulationResponse = {
      success: true,
      winningNumbers,
      totalSubscribers: subscribers?.length || 0,
      matchesByTier: {
        tier5: matchesByTier[5] || [],
        tier4: matchesByTier[4] || [],
        tier3: matchesByTier[3] || [],
        tier0: matchesByTier[0] || [],
      },
      summary: {
        tier5Count: matchesByTier[5]?.length || 0,
        tier4Count: matchesByTier[4]?.length || 0,
        tier3Count: matchesByTier[3]?.length || 0,
        totalWinners,
      },
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 });
    }

    console.error('Draw simulation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
