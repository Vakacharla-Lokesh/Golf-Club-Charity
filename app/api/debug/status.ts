import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { data: charities, error: charitiesError } = await supabaseAdmin
      .from('charities')
      .select('count()', { count: 'exact' });

    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('count()', { count: 'exact' });

    return NextResponse.json({
      database: {
        charities: {
          count: charities?.length ?? 0,
          error: charitiesError?.message,
        },
        profiles: {
          count: profiles?.length ?? 0,
          error: profilesError?.message,
        },
      },
      message: 'If counts are 0, you need to seed the database using the seed.sql file in Supabase SQL Editor',
    });
  } catch (error) {
    console.error('Debug endpoint error:', error);
    return NextResponse.json(
      {
        error: 'Failed to check database',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
