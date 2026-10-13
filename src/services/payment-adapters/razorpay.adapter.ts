import crypto from 'crypto';
import { IPaymentProviderAdapter, PaymentOrderResult, PaymentVerificationResult } from './types';

export class RazorpayAdapter implements IPaymentProviderAdapter {
  readonly gatewayName = 'RAZORPAY';

  private getKeyId(): string {
    return process.env.RAZORPAY_KEY_ID || 'rzp_test_cpc_market';
  }

  private getKeySecret(): string {
    return process.env.RAZORPAY_KEY_SECRET || 'test_secret_cpc_marketplace_2026';
  }

  async createOrder(amountFiatPaise: number, receiptId: string): Promise<PaymentOrderResult> {
    // Generate realistic Razorpay order format
    const gatewayOrderId = `order_${crypto.randomBytes(10).toString('hex')}`;

    return {
      gatewayOrderId,
      amountFiatPaise,
      currency: 'INR',
      keyId: this.getKeyId(),
      gateway: this.gatewayName,
    };
  }

  verifySignature(orderId: string, paymentId: string, signature: string, secret?: string): boolean {
    const keySecret = secret || this.getKeySecret();
    const expectedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');

    const expectedBuf = Buffer.from(expectedSignature, 'utf-8');
    const signatureBuf = Buffer.from(signature, 'utf-8');

    if (expectedBuf.length !== signatureBuf.length) {
      return false;
    }

    return crypto.timingSafeEqual(expectedBuf, signatureBuf);
  }

  async verifyPayment(
    orderId: string,
    paymentId: string,
    signature?: string
  ): Promise<PaymentVerificationResult> {
    if (!signature) {
      return {
        isVerified: false,
        gatewayPaymentId: paymentId,
        gatewayOrderId: orderId,
        amountPaidPaise: 0,
        status: 'FAILED',
        failureReason: 'Missing Razorpay cryptographic signature',
      };
    }

    try {
      const isValid = this.verifySignature(orderId, paymentId, signature);
      if (!isValid) {
        return {
          isVerified: false,
          gatewayPaymentId: paymentId,
          gatewayOrderId: orderId,
          amountPaidPaise: 0,
          status: 'FAILED',
          failureReason: 'HMAC-SHA256 signature mismatch',
        };
      }

      return {
        isVerified: true,
        gatewayPaymentId: paymentId,
        gatewayOrderId: orderId,
        amountPaidPaise: 0, // will be matched against deposit amount in database
        status: 'PAID',
      };
    } catch (err: any) {
      return {
        isVerified: false,
        gatewayPaymentId: paymentId,
        gatewayOrderId: orderId,
        amountPaidPaise: 0,
        status: 'FAILED',
        failureReason: err.message || 'Signature verification error',
      };
    }
  }

  verifyWebhookSignature(rawBody: string, signature: string, secret?: string): boolean {
    const webhookSecret = secret || process.env.RAZORPAY_WEBHOOK_SECRET || this.getKeySecret();
    const expected = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawBody)
      .digest('hex');

    const expectedBuf = Buffer.from(expected, 'utf-8');
    const signatureBuf = Buffer.from(signature, 'utf-8');

    if (expectedBuf.length !== signatureBuf.length) {
      return false;
    }

    try {
      return crypto.timingSafeEqual(expectedBuf, signatureBuf);
    } catch {
      return false;
    }
  }
}
