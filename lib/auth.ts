import { createClient } from "@supabase/supabase-js";
import { NextRequest } from "next/server";
import { env } from "@/lib/env";

export async function getSession() {
  const supabase = createClient(env.getSupabaseUrl(), env.getSupabaseAnonKey());

  const {
    data: { session },
  } = await supabase.auth.getSession();

  return session;
}

export async function getSessionFromRequest(request: NextRequest) {
  const supabase = createClient(env.getSupabaseUrl(), env.getSupabaseAnonKey());

  const {
    data: { session },
  } = await supabase.auth.getSession();

  return session;
}

export function isAdmin(userEmail: string): boolean {
  return env.isAdminEmail(userEmail);
}

export async function getCurrentUser() {
  const session = await getSession();
  if (!session) return null;

  return {
    id: session.user.id,
    email: session.user.email,
    isAdmin: isAdmin(session.user.email || ""),
  };
}
