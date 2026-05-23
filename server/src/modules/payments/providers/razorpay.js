import crypto from 'crypto';
import Razorpay from 'razorpay';

let client;

export function getRazorpayClient() {
  if (!client) {
    client = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
  return client;
}

export async function createRazorpayOrder(amount, currency = 'INR', receiptId, notes = {}) {
  const rpay = getRazorpayClient();
  return rpay.orders.create({ amount, currency, receipt: receiptId, notes });
}

export function verifyRazorpaySignature(orderId, paymentId, signature) {
  const body = `${orderId}|${paymentId}`;
  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest('hex');
  return expected === signature;
}
