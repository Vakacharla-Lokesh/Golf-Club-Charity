// Prize Pool Distribution Percentages
export const PRIZE_POOL_PERCENTAGES = {
  TIER_5: 0.4, // 40% for matching all 5 numbers
  TIER_4: 0.35, // 35% for matching 4 numbers
  TIER_3: 0.25, // 25% for matching 3 numbers
} as const;

// Draw Configuration
export const DRAW_CONFIG = {
  MIN_WINNING_NUMBERS: 5,
  MIN_SCORE: 1,
  MAX_SCORE: 45,
  MAX_SCORES_PER_USER: 5,
  MIN_SCORES_FOR_DRAW: 1,
} as const;

// Charity Configuration
export const CHARITY_CONFIG = {
  MIN_PERCENTAGE: 10,
  MAX_PERCENTAGE: 100,
  DEFAULT_PERCENTAGE: 10,
} as const;

// Subscription Plans (will be synced with Stripe)
export const SUBSCRIPTION_PLANS = {
  MONTHLY: 'monthly',
  YEARLY: 'yearly',
} as const;

// Subscription Status
export const SUBSCRIPTION_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  LAPSED: 'lapsed',
  CANCELLED: 'cancelled',
} as const;

// Payment Status
export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
} as const;

// Draw Status
export const DRAW_STATUS = {
  DRAFT: 'draft',
  SIMULATED: 'simulated',
  PUBLISHED: 'published',
} as const;

// Draw Types
export const DRAW_TYPES = {
  RANDOM: 'random',
  ALGORITHMIC: 'algorithmic',
} as const;

// Match Types (number of correct scores)
export const MATCH_TYPES = {
  THREE: 3,
  FOUR: 4,
  FIVE: 5,
} as const;

// API Routes
export const API_ROUTES = {
  // Auth
  AUTH_CALLBACK: '/api/auth/callback',
  
  // Scores
  SCORES_SUBMIT: '/api/scores/submit',
  SCORES_LIST: '/api/scores/list',
  SCORES_UPSERT: '/api/scores/upsert',
  
  // Stripe
  STRIPE_CHECKOUT: '/api/stripe/create-checkout',
  STRIPE_WEBHOOK: '/api/webhooks/stripe',
  
  // Admin
  ADMIN_USERS: '/api/admin/users',
  ADMIN_DRAWS_SIMULATE: '/api/admin/draw/simulate',
  ADMIN_DRAWS_PUBLISH: '/api/admin/draw/publish',
  ADMIN_CHARITIES: '/api/admin/charities',
  ADMIN_WINNERS: '/api/admin/winners',
} as const;
