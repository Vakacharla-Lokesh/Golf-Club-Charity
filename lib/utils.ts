import { DRAW_CONFIG } from './constants';

/**
 * Check if a user's score list is valid for draw participation
 * Rules: 1-5 scores, each between 1-45
 */
export function isValidScoreList(scores: number[]): boolean {
  if (scores.length === 0 || scores.length > DRAW_CONFIG.MAX_SCORES_PER_USER) {
    return false;
  }
  return scores.every((score) => score >= DRAW_CONFIG.MIN_SCORE && score <= DRAW_CONFIG.MAX_SCORE);
}

/**
 * Check match type between user scores and draw winning numbers
 * Returns: 3, 4, 5 (for match count) or null (no match)
 */
export function checkMatch(userScores: number[], drawNumbers: number[]): 3 | 4 | 5 | null {
  const matches = userScores.filter((score) => drawNumbers.includes(score)).length;

  if (matches >= 5) return 5;
  if (matches >= 4) return 4;
  if (matches >= 3) return 3;
  return null;
}

/**
 * Sort scores in ascending order
 */
export function sortScores(scores: number[]): number[] {
  return [...scores].sort((a, b) => a - b);
}

/**
 * Format currency value for display
 */
export function formatCurrency(amount: number, currency: string = 'INR'): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format date for display
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Get subscription renewal date
 */
export function getSubscriptionRenewalDate(currentPeriodEnd: string | null): string | null {
  if (!currentPeriodEnd) return null;
  return formatDate(currentPeriodEnd);
}

/**
 * Calculate years from date
 */
export function getYearsAgo(dateString: string): number {
  const date = new Date(dateString);
  const now = new Date();
  return Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24 * 365));
}

/**
 * Calculate prize amount for tier
 * - Total subscription pool from active subscribers × plan amount
 * - Divide by tier percentage and number of winners
 * - Formula: (totalPool × tierPercentage) / winnerCount
 */
export function calculatePrizeAmount(
  totalPoolAmount: number,
  tierPercentage: number,
  winnerCount: number
): number {
  if (winnerCount === 0) return 0;
  return (totalPoolAmount * tierPercentage) / winnerCount;
}

/**
 * Generate random numbers for draw (1-45, count=5, unique)
 */
export function generateRandomDraw(): number[] {
  const numbers = new Set<number>();
  while (numbers.size < 5) {
    numbers.add(Math.floor(Math.random() * 45) + 1);
  }
  return sortScores([...numbers]);
}

/**
 * Validate charity percentage
 */
export function isValidCharityPercentage(percentage: number): boolean {
  return percentage >= 10 && percentage <= 100 && Number.isInteger(percentage);
}
