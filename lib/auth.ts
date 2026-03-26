/**
 * Authentication helper functions
 */
import { getAdminEmails } from '@/lib/env';

/**
 * Check if user email is in admin list
 * Admin emails come from ADMIN_EMAILS env var (comma-separated)
 */
export function isAdmin(userEmail: string | undefined): boolean {
  if (!userEmail) return false;

  const normalizedUserEmail = userEmail.trim().toLowerCase();
  return getAdminEmails().includes(normalizedUserEmail);
}

/**
 * Extract email from Supabase JWT (for middleware/server contexts)
 */
export function getEmailFromJwt(jwt: string | undefined): string | null {
  if (!jwt) return null;

  try {
    const payload = jwt.split('.')[1];
    if (!payload) return null;

    const decoded = JSON.parse(Buffer.from(payload, 'base64').toString());
    return decoded.email || null;
  } catch {
    return null;
  }
}
