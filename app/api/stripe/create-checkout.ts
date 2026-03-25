import { NextRequest, NextResponse } from 'next/server';
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { createCheckoutSession, getOrCreateCustomer } from '@/lib/stripe';
import { checkoutSchema } from '@/lib/validators';
import { z } from 'zod';

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = createMiddlewareClient({ req: request, res: NextResponse.next() });
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validate request body
    const body = await request.json();
    const validated = checkoutSchema.parse(body);

    // Get or create Stripe customer
    const customerId = await getOrCreateCustomer(session.user.email, session.user.id);

    // Create checkout session
    const checkoutUrl = await createCheckoutSession(
      customerId,
      validated.priceId,
      session.user.id
    );

    return NextResponse.json(
      {
        success: true,
        url: checkoutUrl,
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
