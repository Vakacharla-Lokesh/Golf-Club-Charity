import type { SupabaseClient } from '@supabase/supabase-js';

export type BillingPlan = 'monthly' | 'yearly';
export type ProfileSubscriptionState = 'active' | 'inactive' | 'lapsed';

export interface ProfileRecord {
  id: string;
  auth_user_id: string;
  full_name: string | null;
  subscription_status: ProfileSubscriptionState;
  subscription_plan: BillingPlan | null;
  stripe_customer_id: string | null;
}

export interface SubscriptionRecord {
  id: string;
  user_id: string;
  plan: BillingPlan;
  amount: number;
  status: 'active' | 'cancelled' | 'lapsed';
  stripe_subscription_id: string | null;
  current_period_end: string | null;
}

type AdminClient = SupabaseClient;

export function resolvePlanFromPriceId(priceId: string): BillingPlan {
  return priceId.includes('year') ? 'yearly' : 'monthly';
}

export async function getProfileByAuthUserId(
  client: SupabaseClient,
  authUserId: string
): Promise<ProfileRecord | null> {
  const { data, error } = await client
    .from('profiles')
    .select(
      'id, auth_user_id, full_name, subscription_status, subscription_plan, stripe_customer_id'
    )
    .eq('auth_user_id', authUserId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function getSubscriptionByProfileId(
  client: SupabaseClient,
  profileId: string
): Promise<SubscriptionRecord | null> {
  const { data, error } = await client
    .from('subscriptions')
    .select(
      'id, user_id, plan, amount, status, stripe_subscription_id, current_period_end'
    )
    .eq('user_id', profileId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function activateSubscriptionForUser(
  adminClient: AdminClient,
  authUserId: string,
  input: {
    amount: number;
    currentPeriodEnd: string;
    plan: BillingPlan;
    stripeCustomerId?: string | null;
    stripeSubscriptionId: string;
  }
): Promise<ProfileRecord> {
  const profile = await getProfileByAuthUserId(adminClient, authUserId);

  if (!profile) {
    throw new Error('Profile not found');
  }

  const { error: subscriptionError } = await adminClient.from('subscriptions').upsert(
    {
      user_id: profile.id,
      plan: input.plan,
      amount: input.amount,
      status: 'active',
      stripe_subscription_id: input.stripeSubscriptionId,
      current_period_end: input.currentPeriodEnd,
    },
    { onConflict: 'user_id' }
  );

  if (subscriptionError) {
    throw new Error(subscriptionError.message);
  }

  const { data: updatedProfile, error: profileError } = await adminClient
    .from('profiles')
    .update({
      subscription_status: 'active',
      subscription_plan: input.plan,
      ...(input.stripeCustomerId !== undefined && {
        stripe_customer_id: input.stripeCustomerId,
      }),
    })
    .eq('auth_user_id', authUserId)
    .select(
      'id, auth_user_id, full_name, subscription_status, subscription_plan, stripe_customer_id'
    )
    .single();

  if (profileError) {
    throw new Error(profileError.message);
  }

  return updatedProfile;
}

export async function deactivateSubscriptionForUser(
  adminClient: AdminClient,
  authUserId: string,
  input: {
    nextSubscriptionStatus: SubscriptionRecord['status'];
    stripeSubscriptionId?: string | null;
  }
): Promise<{ profile: ProfileRecord | null; subscription: SubscriptionRecord | null }> {
  const profile = await getProfileByAuthUserId(adminClient, authUserId);

  if (!profile) {
    throw new Error('Profile not found');
  }

  let subscription = await getSubscriptionByProfileId(adminClient, profile.id);

  if (!subscription && input.stripeSubscriptionId) {
    const { data, error } = await adminClient
      .from('subscriptions')
      .select(
        'id, user_id, plan, amount, status, stripe_subscription_id, current_period_end'
      )
      .eq('stripe_subscription_id', input.stripeSubscriptionId)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    subscription = data;
  }

  if (subscription) {
    const { error: subscriptionError } = await adminClient
      .from('subscriptions')
      .update({ status: input.nextSubscriptionStatus, user_id: profile.id })
      .eq('id', subscription.id);

    if (subscriptionError) {
      throw new Error(subscriptionError.message);
    }
  }

  const { data: updatedProfile, error: profileError } = await adminClient
    .from('profiles')
    .update({
      subscription_status:
        input.nextSubscriptionStatus === 'lapsed' ? 'lapsed' : 'inactive',
      subscription_plan: input.nextSubscriptionStatus === 'lapsed' ? profile.subscription_plan : null,
    })
    .eq('auth_user_id', authUserId)
    .select(
      'id, auth_user_id, full_name, subscription_status, subscription_plan, stripe_customer_id'
    )
    .single();

  if (profileError) {
    throw new Error(profileError.message);
  }

  return {
    profile: updatedProfile,
    subscription,
  };
}
