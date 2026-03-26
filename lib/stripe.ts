import Stripe from 'stripe';
import { getPublicAppUrl, getStripeSecretKey } from '@/lib/env';

const apiVersion = '2023-10-16' as const;
const appUrl = getPublicAppUrl();

/**
 * Initialize Stripe with secret key
 * Only for server-side use (API routes)
 */
export const stripe = new Stripe(getStripeSecretKey(), {
  apiVersion,
});

/**
 * Create a Stripe checkout session for subscription
 */
export async function createCheckoutSession(
  customerId: string,
  priceId: string,
  userId: string
): Promise<string> {
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    mode: 'subscription',
    success_url: `${appUrl}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/dashboard`,
    metadata: {
      userId,
    },
  });

  if (!session.url) {
    throw new Error('No checkout URL returned from Stripe');
  }

  return session.url;
}

/**
 * Get or create a Stripe customer for a user
 */
export async function getOrCreateCustomer(
  email: string,
  userId: string
): Promise<string> {
  // Check if customer already exists for this email
  const customers = await stripe.customers.list({
    email,
    limit: 1,
  });

  if (customers.data.length > 0) {
    return customers.data[0].id;
  }

  // Create new customer
  const customer = await stripe.customers.create({
    email,
    metadata: {
      userId,
    },
  });

  return customer.id;
}
