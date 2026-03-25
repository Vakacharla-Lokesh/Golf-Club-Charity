/**
 * Core domain types for Golf Charity Platform
 * All types are strict, no implicit any
 * Use named exports for modularity
 */

/**
 * User profile (extended from Supabase auth.users)
 */
export interface Profile {
  id: string;
  auth_user_id: string;
  full_name: string;
  subscription_status: 'active' | 'inactive' | 'cancelled' | 'lapsed';
  subscription_plan: 'monthly' | 'yearly' | null;
  charity_id: string | null;
  charity_percentage: number; // 10-100
  stripe_customer_id: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Charity organization
 */
export interface Charity {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  is_featured: boolean;
  is_active: boolean;
  created_at: string;
}

/**
 * Golf score entry (1-45 range)
 */
export interface GolfScore {
  id: string;
  user_id: string;
  score: number; // 1-45
  played_at: string; // ISO date
  created_at: string;
}

/**
 * Draw event
 */
export interface Draw {
  id: string;
  draw_date: string; // ISO date
  status: 'draft' | 'simulated' | 'published';
  winning_numbers: number[]; // 5 numbers
  draw_type: 'random' | 'algorithmic';
  created_at: string;
  published_at: string | null;
}

/**
 * Snapshot of user scores at draw time
 */
export interface DrawEntry {
  id: string;
  draw_id: string;
  user_id: string;
  scores: number[]; // User's 5 scores at time of draw
  created_at: string;
}

/**
 * Draw result (winner info)
 */
export interface DrawResult {
  id: string;
  draw_id: string;
  user_id: string;
  match_type: 3 | 4 | 5; // Number of matched scores
  prize_amount: number;
  payment_status: 'pending' | 'paid' | 'rejected';
  proof_url: string | null;
  created_at: string;
}

/**
 * Prize pool allocation for a draw
 */
export interface PrizePool {
  id: string;
  draw_id: string;
  tier_5: number; // 40% of pool (all 5 match)
  tier_4: number; // 35% of pool (4 match)
  tier_3: number; // 25% of pool (3 match)
  jackpot_rollover: number; // Carried from previous draw
  total_pool: number;
  created_at: string;
}

/**
 * Stripe subscription tracking
 */
export interface Subscription {
  id: string;
  user_id: string;
  plan: 'monthly' | 'yearly';
  amount: number;
  status: 'active' | 'cancelled' | 'lapsed';
  stripe_subscription_id: string;
  current_period_end: string; // ISO timestamp
  created_at: string;
  updated_at: string;
}

/**
 * Utility type for API responses
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Partial profile for updates
 */
export type ProfileUpdate = Partial<Omit<Profile, 'id' | 'auth_user_id' | 'created_at'>>;
