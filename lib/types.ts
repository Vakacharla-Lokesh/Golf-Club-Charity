// Domain entity types
export interface Profile {
  id: string;
  auth_user_id: string;
  full_name: string | null;
  subscription_status: 'active' | 'inactive' | 'lapsed';
  subscription_plan: 'monthly' | 'yearly' | null;
  charity_id: string | null;
  charity_percentage: number;
  stripe_customer_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Charity {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  is_featured: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface GolfScore {
  id: string;
  user_id: string;
  score: number;
  played_at: string;
  created_at: string;
  updated_at: string;
}

export interface Draw {
  id: string;
  draw_date: string;
  status: 'draft' | 'simulated' | 'published';
  winning_numbers: number[] | null;
  draw_type: 'random' | 'algorithmic';
  created_at: string;
  updated_at: string;
}

export interface DrawEntry {
  id: string;
  draw_id: string;
  user_id: string;
  scores: number[];
  created_at: string;
}

export interface DrawResult {
  id: string;
  draw_id: string;
  user_id: string;
  match_type: 3 | 4 | 5;
  prize_amount: number;
  payment_status: 'pending' | 'paid';
  proof_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface PrizePool {
  id: string;
  draw_id: string;
  tier_5: number;
  tier_4: number;
  tier_3: number;
  jackpot_rollover: number;
  created_at: string;
  updated_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  plan: 'monthly' | 'yearly';
  amount: number;
  status: 'active' | 'cancelled' | 'lapsed';
  stripe_subscription_id: string | null;
  current_period_end: string | null;
  created_at: string;
  updated_at: string;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface CurrentUser {
  id: string;
  email: string;
  isAdmin: boolean;
}
