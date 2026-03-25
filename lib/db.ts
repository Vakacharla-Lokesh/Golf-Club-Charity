import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseClient: SupabaseClient | null = null;
let supabaseAdminClient: SupabaseClient | null = null;

function initSupabaseClient(): SupabaseClient {
  if (supabaseClient) return supabaseClient;
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9';

  supabaseClient = createClient(supabaseUrl, supabaseKey);
  return supabaseClient;
}

function initSupabaseAdminClient(): SupabaseClient {
  if (supabaseAdminClient) return supabaseAdminClient;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder';

  supabaseAdminClient = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
  return supabaseAdminClient;
}

/**
 * Client-side Supabase instance
 * Uses anon key with RLS enforcement
 * Safe for browser + API routes
 */
export const supabase = new Proxy({}, {
  get: (target, prop) => {
    const client = initSupabaseClient();
    return (client as any)[prop];
  },
}) as unknown as SupabaseClient;

/**
 * Server-side admin Supabase instance
 * Uses service role key to bypass RLS
 * ONLY for API routes, never expose to client
 */
export const supabaseAdmin = new Proxy({}, {
  get: (target, prop) => {
    const client = initSupabaseAdminClient();
    return (client as any)[prop];
  },
}) as unknown as SupabaseClient;
