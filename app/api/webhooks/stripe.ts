import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { supabaseAdmin } from '@/lib/db';
import Stripe from 'stripe';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

export async function POST(request: NextRequest) {
  if (!webhookSecret) {
    return NextResponse.json(
      { error: 'Webhook secret not configured' },
      { status: 500 }
    );
  }

  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      );
    }

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      const error = err as Error;
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Handle diffferent event types
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutSessionCompleted(session);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentFailed(invoice);
        break;
      }

      default:
        // Silently ignore unknown events
        break;
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

/**
 * Handle checkout.session.completed event
 * User has successfully paid for a subscription
 */
async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session
): Promise<void> {
  const userId = session.metadata?.userId;
  const subscriptionId = session.subscription as string;

  if (!userId || !subscriptionId) {
    console.error('Missing userId or subscriptionId in session metadata');
    return;
  }

  // Fetch subscription details from Stripe
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);

  // Determine plan based on price
  const lineItem = subscription.items.data[0];
  const price = await stripe.prices.retrieve(lineItem.price.id);
  const plan = price.recurring?.interval === 'month' ? 'monthly' : 'yearly';

  // Update subscriptions table
  const { error } = await supabaseAdmin
    .from('subscriptions')
    .upsert({
      user_id: userId,
      plan,
      amount: (price.unit_amount || 0) / 100, // Convert to decimal
      status: 'active',
      stripe_subscription_id: subscriptionId,
      current_period_end: new Date(
        subscription.current_period_end * 1000
      ).toISOString(),
    });

  if (error) {
    console.error('Error updating subscriptions table:', error);
    return;
  }

  // Update profiles table
  await supabaseAdmin
    .from('profiles')
    .update({
      subscription_status: 'active',
      subscription_plan: plan,
      stripe_customer_id: session.customer as string,
    })
    .eq('id', userId);
}

/**
 * Handle customer.subscription.deleted event
 * User has cancelled their subscription
 */
async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription
): Promise<void> {
  const subscriptionId = subscription.id;

  // Find user by subscription ID
  const { data, error } = await supabaseAdmin
    .from('subscriptions')
    .select('user_id')
    .eq('stripe_subscription_id', subscriptionId)
    .single();

  if (error || !data) {
    console.error('Subscription not found:', subscriptionId);
    return;
  }

  const userId = data.user_id;

  // Update subscription status
  await supabaseAdmin
    .from('subscriptions')
    .update({ status: 'cancelled' })
    .eq('stripe_subscription_id', subscriptionId);

  // Update profile
  await supabaseAdmin
    .from('profiles')
    .update({ subscription_status: 'cancelled' })
    .eq('id', userId);
}

/**
 * Handle invoice.payment_failed event
 * Payment failed, mark subscription as lapsed
 */
async function handlePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
  const subscriptionId = invoice.subscription as string;

  if (!subscriptionId) {
    return;
  }

  // Find user by subscription ID
  const { data, error } = await supabaseAdmin
    .from('subscriptions')
    .select('user_id')
    .eq('stripe_subscription_id', subscriptionId)
    .single();

  if (error || !data) {
    console.error('Subscription not found for payment failure:', subscriptionId);
    return;
  }

  const userId = data.user_id;

  // Update subscription status
  await supabaseAdmin
    .from('subscriptions')
    .update({ status: 'lapsed' })
    .eq('stripe_subscription_id', subscriptionId);

  // Update profile
  await supabaseAdmin
    .from('profiles')
    .update({ subscription_status: 'lapsed' })
    .eq('id', userId);
}
