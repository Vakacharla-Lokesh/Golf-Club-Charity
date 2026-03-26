import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { stripe } from '@/lib/stripe';
import { supabaseAdmin } from '@/lib/db';
import {
  getOptionalStripeSecretKey,
  getPublicSupabaseAnonKey,
  getPublicSupabaseUrl,
} from '@/lib/env';
import {
  deactivateSubscriptionForUser,
  getProfileByAuthUserId,
  getSubscriptionByProfileId,
} from '@/lib/subscriptions';

export async function POST(request: NextRequest) {
  try {
    // Get auth token from header
    const authHeader = request.headers.get('authorization');
    
    // Create Supabase client with auth token
    const supabase = createClient(
      getPublicSupabaseUrl(),
      getPublicSupabaseAnonKey(),
      {
        global: {
          headers: authHeader ? { Authorization: authHeader } : {},
        },
      }
    );
    
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = user.id;

    const profile = await getProfileByAuthUserId(supabaseAdmin, userId);

    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    const subscription = await getSubscriptionByProfileId(supabaseAdmin, profile.id);

    if (!subscription && profile.subscription_status !== 'active') {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 404 }
      );
    }

    if (
      subscription?.stripe_subscription_id &&
      !subscription.stripe_subscription_id.startsWith('mock_') &&
      getOptionalStripeSecretKey()?.startsWith('sk_')
    ) {
      await stripe.subscriptions.update(subscription.stripe_subscription_id, {
        cancel_at_period_end: true,
      });
    }

    await deactivateSubscriptionForUser(supabaseAdmin, userId, {
      nextSubscriptionStatus: 'cancelled',
      stripeSubscriptionId: subscription?.stripe_subscription_id,
    });

    return NextResponse.json(
      {
        success: true,
        message: subscription
          ? 'Subscription cancelled successfully'
          : 'Subscription state cleared successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
