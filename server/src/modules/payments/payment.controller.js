import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { createRazorpayOrder, verifyRazorpaySignature } from './providers/razorpay.js';
import { createStripePaymentIntent, constructStripeEvent } from './providers/stripe.js';
import { completeOrderAfterPayment } from '../orders/order.service.js';
import { ApiError } from '../../utils/ApiError.js';

export const razorpayCreateOrder = asyncHandler(async (req, res) => {
  const { amount, orderId } = req.body;
  const rzpOrder = await createRazorpayOrder(amount, 'INR', orderId, { userId: req.user._id.toString(), orderId });
  res.json(new ApiResponse(200, {
    gatewayOrderId: rzpOrder.id,
    amount: rzpOrder.amount,
    currency: rzpOrder.currency,
    key: process.env.RAZORPAY_KEY_ID,
  }));
});

export const razorpayVerify = asyncHandler(async (req, res) => {
  const { orderId, gatewayOrderId, gatewayPaymentId, gatewaySignature } = req.body;
  const isValid = verifyRazorpaySignature(gatewayOrderId, gatewayPaymentId, gatewaySignature);
  if (!isValid) throw new ApiError(400, 'Payment signature verification failed');

  await completeOrderAfterPayment(orderId, gatewayPaymentId, 'razorpay');
  res.json(new ApiResponse(200, null, 'Payment verified. Order completed.'));
});

export const stripeCreateIntent = asyncHandler(async (req, res) => {
  const { amount, orderId } = req.body;
  const intent = await createStripePaymentIntent(amount, 'inr', {
    orderId,
    userId: req.user._id.toString(),
  });
  res.json(new ApiResponse(200, { clientSecret: intent.client_secret }));
});

export const stripeWebhook = asyncHandler(async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = constructStripeEvent(req.rawBody || req.body, sig);
  } catch {
    return res.status(400).send('Webhook signature verification failed');
  }

  if (event.type === 'payment_intent.succeeded') {
    const intent = event.data.object;
    const { orderId } = intent.metadata;
    if (orderId) await completeOrderAfterPayment(orderId, intent.id, 'stripe');
  }

  res.json({ received: true });
});
