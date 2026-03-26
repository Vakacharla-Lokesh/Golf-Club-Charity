function getEnv(name: string, fallback?: string): string {
  const value = process.env[name];

  if (typeof value === 'string' && value.length > 0) {
    return value;
  }

  if (fallback !== undefined) {
    return fallback;
  }

  throw new Error(`Missing environment variable: ${name}`);
}

function getOptionalEnv(name: string): string | undefined {
  const value = process.env[name];
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

export function getPublicSupabaseUrl(): string {
  return getEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://placeholder.supabase.co');
}

export function getPublicSupabaseAnonKey(): string {
  return getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9');
}

export function getSupabaseServiceRoleKey(): string {
  return getEnv('SUPABASE_SERVICE_ROLE_KEY', 'placeholder');
}

export function getPublicAppUrl(): string {
  return getEnv('NEXT_PUBLIC_APP_URL', 'http://localhost:3000');
}

export function getPublicStripeMonthlyPriceId(): string {
  return getEnv('NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID', 'price_monthly_test');
}

export function getPublicStripeYearlyPriceId(): string {
  return getEnv('NEXT_PUBLIC_STRIPE_YEARLY_PRICE_ID', 'price_yearly_test');
}

export function getStripeSecretKey(): string {
  return getEnv('STRIPE_SECRET_KEY', '');
}

export function getOptionalStripeSecretKey(): string | undefined {
  return getOptionalEnv('STRIPE_SECRET_KEY');
}

export function getStripeWebhookSecret(): string {
  return getEnv('STRIPE_WEBHOOK_SECRET', '');
}

export function getAdminEmails(): string[] {
  return getEnv('ADMIN_EMAILS', '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter((email) => email.length > 0);
}

export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}
