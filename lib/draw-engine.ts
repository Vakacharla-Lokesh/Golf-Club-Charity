/**
 * Draw Engine - Pure functions for draw logic
 * No side effects, easily testable, reusable
 */

import { PRIZE_SPLIT } from './constants';

/**
 * Generate random winning numbers for a draw
 * Returns array of 5 unique numbers between 1-45
 */
export function generateWinningNumbers(): number[] {
  const numbers: number[] = [];
  while (numbers.length < 5) {
    const num = Math.floor(Math.random() * 45) + 1;
    if (!numbers.includes(num)) {
      numbers.push(num);
    }
  }
  return numbers.sort((a, b) => a - b);
}

/**
 * Calculate number of matches between scores and winning numbers
 */
export function calculateMatches(scores: number[], winningNumbers: number[]): number {
  return scores.filter((score) => winningNumbers.includes(score)).length;
}

/**
 * Determine prize tier based on match count
 * Tier 5: 5 matches (40% of prize pool)
 * Tier 4: 4 matches (35% of prize pool)
 * Tier 3: 3 matches (25% of prize pool)
 * Tier 0: 2 or fewer matches (no prize)
 */
export function getPrizeTier(matchCount: number): number {
  if (matchCount >= 5) return 5;
  if (matchCount >= 4) return 4;
  if (matchCount >= 3) return 3;
  return 0; // No prize
}

/**
 * Calculate per-winner prize amounts
 * Distribution: equal split within each tier
 */
export interface PrizeCalculation {
  tier5Amount: number;
  tier4Amount: number;
  tier3Amount: number;
  tier5Count: number;
  tier4Count: number;
  tier3Count: number;
  totalPool: number;
}

export function calculatePrizes(
  tier5Winners: number,
  tier4Winners: number,
  tier3Winners: number,
  totalPool: number = 10000 // Default ₹10,000 for testing
): PrizeCalculation {
  const tier5Pool = totalPool * PRIZE_SPLIT.tier5;
  const tier4Pool = totalPool * PRIZE_SPLIT.tier4;
  const tier3Pool = totalPool * PRIZE_SPLIT.tier3;

  return {
    tier5Amount: tier5Winners > 0 ? tier5Pool / tier5Winners : 0,
    tier4Amount: tier4Winners > 0 ? tier4Pool / tier4Winners : 0,
    tier3Amount: tier3Winners > 0 ? tier3Pool / tier3Winners : 0,
    tier5Count: tier5Winners,
    tier4Count: tier4Winners,
    tier3Count: tier3Winners,
    totalPool,
  };
}

/**
 * Validate draw results
 * Ensures winning numbers are within valid range and match count checks
 */
export function validateDrawResult(scores: number[], winningNumbers: number[]): {
  isValid: boolean;
  error?: string;
} {
  // Check winning numbers
  if (winningNumbers.length !== 5) {
    return { isValid: false, error: 'Must have exactly 5 winning numbers' };
  }

  if (winningNumbers.some((n) => n < 1 || n > 45)) {
    return { isValid: false, error: 'Winning numbers must be between 1 and 45' };
  }

  if (new Set(winningNumbers).size !== 5) {
    return { isValid: false, error: 'Winning numbers must be unique' };
  }

  // Check scores
  if (scores.some((s) => s < 1 || s > 45)) {
    return { isValid: false, error: 'Scores must be between 1 and 45' };
  }

  return { isValid: true };
}

/**
 * Simulate draw and return results
 * Used for testing and admin preview
 */
export interface DrawEntry {
  userId: string;
  scores: number[];
}

export interface DrawResultSummary {
  winnersCount: number;
  tier5: { count: number; individual: number };
  tier4: { count: number; individual: number };
  tier3: { count: number; individual: number };
  totalReleased: number;
}

export function simulateDraw(
  entries: DrawEntry[],
  totalPool: number = 10000
): DrawResultSummary {
  const winningNumbers = generateWinningNumbers();

  let tier5Count = 0;
  let tier4Count = 0;
  let tier3Count = 0;

  entries.forEach((entry) => {
    const matches = calculateMatches(entry.scores, winningNumbers);
    const tier = getPrizeTier(matches);

    if (tier === 5) tier5Count++;
    else if (tier === 4) tier4Count++;
    else if (tier === 3) tier3Count++;
  });

  const prizes = calculatePrizes(tier5Count, tier4Count, tier3Count, totalPool);

  return {
    winnersCount: tier5Count + tier4Count + tier3Count,
    tier5: { count: tier5Count, individual: prizes.tier5Amount },
    tier4: { count: tier4Count, individual: prizes.tier4Amount },
    tier3: { count: tier3Count, individual: prizes.tier3Amount },
    totalReleased:
      tier5Count * prizes.tier5Amount +
      tier4Count * prizes.tier4Amount +
      tier3Count * prizes.tier3Amount,
  };
}
