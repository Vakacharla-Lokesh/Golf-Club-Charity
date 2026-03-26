import type { Charity } from '@/lib/types';

/**
 * Fetch active charities from server-side API
 * This goes through /api/charities/list which has proper auth context
 * Client cannot use direct Supabase queries due to HTTP-only cookies
 */
export async function fetchActiveCharities(searchQuery = ''): Promise<Charity[]> {
  try {
    const url = new URL('/api/charities/list', typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
    if (searchQuery.trim()) {
      url.searchParams.set('search', searchQuery.trim());
    }

    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error(`Failed to fetch charities: ${response.status}`);
    }

    const { data } = await response.json();
    return data ?? [];
  } catch (error) {
    console.error('Error fetching charities:', error);
    throw error;
  }
}
