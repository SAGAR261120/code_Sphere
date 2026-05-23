import Stripe from 'stripe';

let client;

export function getStripeClient() {
  if (!client) client = new Stripe(process.env.STRIPE_SECRET_KEY);
  return client;
}

export async function createStripePaymentIntent(amount, currency = 'inr', metadata = {}) {
  const stripe = getStripeClient();
  return stripe.paymentIntents.create({ amount, currency, metadata, automatic_payment_methods: { enabled: true } });
}

export function constructStripeEvent(payload, signature) {
  const stripe = getStripeClient();
  return stripe.webhooks.constructEvent(payload, signature, process.env.STRIPE_WEBHOOK_SECRET);
}
