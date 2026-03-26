import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  getPublicSupabaseAnonKey,
  getPublicSupabaseUrl,
  getSupabaseServiceRoleKey,
} from '@/lib/env';

let supabaseClient: SupabaseClient | null = null;
let supabaseAdminClient: SupabaseClient | null = null;

/**
 * Browser-safe Supabase client (client-side)
 * Single instance to avoid multiple GoTrueClient warnings
 * persistSession: false because session is managed by proxy via HTTP-only cookies
 * Use /api/auth/user to get the authenticated user server-side
 */
export function initSupabaseClient(): SupabaseClient {
  if (supabaseClient) return supabaseClient;

  const supabaseUrl = getPublicSupabaseUrl();
  const supabaseKey = getPublicSupabaseAnonKey();

  supabaseClient = createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return supabaseClient;
}

/**
 * Server-side admin Supabase instance
 * Uses service role key to bypass RLS
 * ONLY for API routes, never expose to client
 */
export function initSupabaseAdminClient(): SupabaseClient {
  if (supabaseAdminClient) return supabaseAdminClient;

  const supabaseUrl = getPublicSupabaseUrl();
  const supabaseServiceKey = getSupabaseServiceRoleKey();

  supabaseAdminClient = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return supabaseAdminClient;
}

/**
 * Lazy-loaded client instance for use in client components
 * Call this function to get the singleton Supabase client
 */
export const supabase = initSupabaseClient();

/**
 * Lazy-loaded admin instance for API routes
 */
export const supabaseAdmin = initSupabaseAdminClient();
