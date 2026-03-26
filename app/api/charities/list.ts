import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * GET /api/charities/list
 * Fetch active charities (public data, no auth required)
 * Supports search query parameter
 */
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // Ignore setAll errors
            }
          },
        },
      }
    );

    const search = request.nextUrl.searchParams.get('search') || '';

    let query = supabase
      .from('charities')
      .select('*')
      .eq('is_active', true)
      .order('is_featured', { ascending: false })
      .order('name', { ascending: true });

    if (search.trim()) {
      query = query.ilike('name', `%${search.trim()}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Charities fetch error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: data ?? [] });
  } catch (error) {
    console.error('Error fetching charities:', error);
    return NextResponse.json(
      { error: 'Failed to fetch charities' },
      { status: 500 }
    );
  }
}
