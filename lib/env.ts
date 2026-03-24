/**
 * Centralized environment variable management
 * Validates all required env vars at module load time (not runtime)
 * Throws immediately if any required variable is missing
 */

interface EnvConfig {
  readonly supabase: {
    readonly url: string;
    readonly anonKey: string;
    readonly serviceRoleKey: string;
  };
  readonly stripe: {
    readonly publishableKey: string;
    readonly secretKey: string;
    readonly webhookSecret: string;
  };
  readonly admin: {
    readonly emails: string[];
  };
  readonly app: {
    readonly url: string;
    readonly isDevelopment: boolean;
  };
}

/**
 * Validate and transform comma-separated admin emails into an array
 */
function parseAdminEmails(emailsString: string): string[] {
  return emailsString
    .split(",")
    .map((email) => email.trim())
    .filter((email) => email.length > 0);
}

/**
 * Validate a required environment variable exists and return it
 * Throws immediately if missing
 */
function getRequiredEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${key}. ` +
        `Please add it to .env.local or your deployment environment.`
    );
  }
  return value;
}

/**
 * Get an optional environment variable or return a default value
 */
function getOptionalEnv(key: string, defaultValue: string): string {
  return process.env[key] ?? defaultValue;
}

/**
 * Initialize and validate all environment variables
 * This runs once when the module is loaded
 */
function initializeEnv(): EnvConfig {
  // Public variables (can be exposed to client)
  const NEXT_PUBLIC_SUPABASE_URL = getRequiredEnv(
    "NEXT_PUBLIC_SUPABASE_URL"
  );
  const NEXT_PUBLIC_SUPABASE_ANON_KEY = getRequiredEnv(
    "NEXT_PUBLIC_SUPABASE_ANON_KEY"
  );
  const NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = getRequiredEnv(
    "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"
  );
  const NEXT_PUBLIC_APP_URL = getOptionalEnv(
    "NEXT_PUBLIC_APP_URL",
    "http://localhost:3000"
  );

  // Secret variables (server-only)
  const SUPABASE_SERVICE_ROLE_KEY = getRequiredEnv(
    "SUPABASE_SERVICE_ROLE_KEY"
  );
  const STRIPE_SECRET_KEY = getRequiredEnv("STRIPE_SECRET_KEY");
  const STRIPE_WEBHOOK_SECRET = getRequiredEnv("STRIPE_WEBHOOK_SECRET");

  // Optional admin emails (defaults to empty)
  const ADMIN_EMAILS_STRING = getOptionalEnv("ADMIN_EMAILS", "");

  return Object.freeze({
    supabase: Object.freeze({
      url: NEXT_PUBLIC_SUPABASE_URL,
      anonKey: NEXT_PUBLIC_SUPABASE_ANON_KEY,
      serviceRoleKey: SUPABASE_SERVICE_ROLE_KEY,
    }),
    stripe: Object.freeze({
      publishableKey: NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
      secretKey: STRIPE_SECRET_KEY,
      webhookSecret: STRIPE_WEBHOOK_SECRET,
    }),
    admin: Object.freeze({
      emails: parseAdminEmails(ADMIN_EMAILS_STRING),
    }),
    app: Object.freeze({
      url: NEXT_PUBLIC_APP_URL,
      isDevelopment: process.env.NODE_ENV === "development",
    }),
  });
}

// Validate all env vars at module load time
const config = initializeEnv();

/**
 * Export individual getter functions for convenience
 * These allow destructuring or selective access patterns
 */
export const env = {
  // Supabase accessors
  getSupabaseUrl: () => config.supabase.url,
  getSupabaseAnonKey: () => config.supabase.anonKey,
  getSupabaseServiceRoleKey: () => config.supabase.serviceRoleKey,

  // Stripe accessors
  getStripePublishableKey: () => config.stripe.publishableKey,
  getStripeSecretKey: () => config.stripe.secretKey,
  getStripeWebhookSecret: () => config.stripe.webhookSecret,

  // Admin accessors
  getAdminEmails: () => config.admin.emails,
  isAdminEmail: (email: string) => config.admin.emails.includes(email),

  // App accessors
  getAppUrl: () => config.app.url,
  isDevelopment: () => config.app.isDevelopment,

  // Full config (use when you need multiple values)
  getConfig: () => config,
};

// Export the full validated config object for direct access
export default config;
