/**
 * Authentication helper functions
 */

/**
 * Check if user email is in admin list
 * Admin emails come from ADMIN_EMAILS env var (comma-separated)
 */
export function isAdmin(userEmail: string | undefined): boolean {
  if (!userEmail) return false;

  const adminEmails = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((email) => email.trim())
    .filter((email) => email.length > 0);

  return adminEmails.includes(userEmail);
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
