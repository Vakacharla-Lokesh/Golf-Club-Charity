import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/db';
import {
  getOptionalStripeSecretKey,
  getPublicAppUrl,
} from '@/lib/env';
import { createCheckoutSession, getOrCreateCustomer } from '@/lib/stripe';
import {
  activateSubscriptionForUser,
  getProfileByAuthUserId,
  resolvePlanFromPriceId,
} from '@/lib/subscriptions';
import { checkoutSchema } from '@/lib/validators';
import { z } from 'zod';

export async function POST(request: NextRequest) {
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
              // Ignore setAll errors in Server Components
            }
          },
        },
      }
    );

    // Restore session from stored tokens
    const accessToken = cookieStore.get('sb-access-token')?.value;
    const refreshToken = cookieStore.get('sb-refresh-token')?.value;

    if (accessToken && refreshToken) {
      await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validate request body
    const body = await request.json();
    const validated = checkoutSchema.parse(body);

    const isStripeConfigured =
      getOptionalStripeSecretKey()?.startsWith('sk_') === true;

    if (!isStripeConfigured) {
      const fallbackName =
        typeof user.user_metadata?.full_name === 'string'
          ? user.user_metadata.full_name
          : user.email.split('@')[0];

      const existingProfile = await getProfileByAuthUserId(supabaseAdmin, user.id);

      if (!existingProfile) {
        const { error: profileCreateError } = await supabase
          .from('profiles')
          .insert({
            id: crypto.randomUUID(),
            auth_user_id: user.id,
            full_name: fallbackName,
            subscription_status: 'inactive',
          });

        if (profileCreateError) {
          return NextResponse.json({ error: profileCreateError.message }, { status: 500 });
        }
      }

      const plan = resolvePlanFromPriceId(validated.priceId);
      const amount = plan === 'yearly' ? 4999 : 499;

      await activateSubscriptionForUser(supabaseAdmin, user.id, {
        amount,
        currentPeriodEnd: new Date(
          Date.now() + (plan === 'yearly' ? 365 : 30) * 24 * 60 * 60 * 1000
        ).toISOString(),
        plan,
        stripeSubscriptionId: `mock_${user.id}`,
      });

      const fallbackUrl = `${getPublicAppUrl()}/dashboard?mock_checkout=success`;

      return NextResponse.json(
        {
          success: true,
          url: fallbackUrl,
          mode: 'mock',
        },
        { status: 200 }
      );
    }

    // Get or create Stripe customer
    const customerId = await getOrCreateCustomer(user.email, user.id);

    // Create checkout session
    const checkoutUrl = await createCheckoutSession(
      customerId,
      validated.priceId,
      user.id
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
