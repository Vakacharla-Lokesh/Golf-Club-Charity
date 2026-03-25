import { NextRequest, NextResponse } from 'next/server';
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { profileUpdateSchema } from '@/lib/validators';
import { z } from 'zod';

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = createMiddlewareClient({
      req: request,
      res: NextResponse.next(),
    });
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Validate input
    const body = await request.json();
    const validated = profileUpdateSchema.parse(body);

    // Update profile
    const { data, error } = await supabase
      .from('profiles')
      .update({
        ...(validated.charityId !== undefined && { charity_id: validated.charityId }),
        ...(validated.charityPercentage !== undefined && {
          charity_percentage: validated.charityPercentage,
        }),
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      {
        success: true,
        profile: data,
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
