/**
 * Constants for Golf Charity Platform
 * All magic numbers defined here for easy adjustment
 */

// ============================================================================
// GOLF SCORE CONSTRAINTS
// ============================================================================
export const GOLF_SCORE_MIN = 1;
export const GOLF_SCORE_MAX = 45;
export const MAX_SCORES_PER_USER = 5;

// ============================================================================
// CHARITY CONTRIBUTION
// ============================================================================
export const CHARITY_PERCENTAGE_MIN = 10;
export const CHARITY_PERCENTAGE_MAX = 100;
export const CHARITY_PERCENTAGE_DEFAULT = 10;

// ============================================================================
// PRIZE POOL SPLIT (percentage of total pool)
// ============================================================================
export const PRIZE_SPLIT = {
  tier5: 0.4, // 40% for 5-match winners
  tier4: 0.35, // 35% for 4-match winners
  tier3: 0.25, // 25% for 3-match winners
} as const;

// Verify totals
if (
  Math.abs(PRIZE_SPLIT.tier5 + PRIZE_SPLIT.tier4 + PRIZE_SPLIT.tier3 - 1.0) >
  0.001
) {
  throw new Error("Prize split percentages must sum to 1.0");
}

// ============================================================================
// STRIPE CONFIGURATION
// ============================================================================
export const STRIPE_PLAN_MONTHLY =
  process.env.NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID || "price_monthly_test";
export const STRIPE_PLAN_YEARLY =
  process.env.NEXT_PUBLIC_STRIPE_YEARLY_PRICE_ID || "price_yearly_test";

// Amount in smallest currency unit (paise for INR)
export const STRIPE_AMOUNT_MONTHLY = 50000; // ₹500
export const STRIPE_AMOUNT_YEARLY = 500000; // ₹5000

// ============================================================================
// SUBSCRIPTION STATUS
// ============================================================================
export const SUBSCRIPTION_STATUSES = {
  ACTIVE: "active",
  INACTIVE: "inactive",
  CANCELLED: "cancelled",
  LAPSED: "lapsed",
} as const;

export type SubscriptionStatus =
  (typeof SUBSCRIPTION_STATUSES)[keyof typeof SUBSCRIPTION_STATUSES];

// ============================================================================
// DRAW STATUS
// ============================================================================
export const DRAW_STATUSES = {
  DRAFT: "draft",
  SIMULATED: "simulated",
  PUBLISHED: "published",
} as const;

export type DrawStatus = (typeof DRAW_STATUSES)[keyof typeof DRAW_STATUSES];

// ============================================================================
// PAYMENT STATUS
// ============================================================================
export const PAYMENT_STATUSES = {
  PENDING: "pending",
  PAID: "paid",
  REJECTED: "rejected",
} as const;

export type PaymentStatus =
  (typeof PAYMENT_STATUSES)[keyof typeof PAYMENT_STATUSES];

// ============================================================================
// PAGINATION
// ============================================================================
export const DEFAULT_PAGE_SIZE = 10;
export const MAX_PAGE_SIZE = 100;
