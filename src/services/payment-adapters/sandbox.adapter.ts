import crypto from 'crypto';
import { IPaymentProviderAdapter, PaymentOrderResult, PaymentVerificationResult } from './types';

export class SandboxPaymentAdapter implements IPaymentProviderAdapter {
  readonly gatewayName = 'SANDBOX';
  private readonly sandboxSecret = 'sandbox_secret_cpc_market_testing_2026';

  async createOrder(amountFiatPaise: number, receiptId: string): Promise<PaymentOrderResult> {
    const gatewayOrderId = `sbx_ord_${crypto.randomBytes(8).toString('hex')}`;

    return {
      gatewayOrderId,
      amountFiatPaise,
      currency: 'INR',
      keyId: 'sbx_key_cpc_sandbox',
      gateway: this.gatewayName,
    };
  }

  verifySignature(orderId: string, paymentId: string, signature: string, secret?: string): boolean {
    const keySecret = secret || this.sandboxSecret;
    const expected = crypto
      .createHmac('sha256', keySecret)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');

    return expected === signature;
  }

  generateTestSignature(orderId: string, paymentId: string): string {
    return crypto
      .createHmac('sha256', this.sandboxSecret)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');
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
        failureReason: 'Missing sandbox signature',
      };
    }

    const isValid = this.verifySignature(orderId, paymentId, signature);
    return {
      isVerified: isValid,
      gatewayPaymentId: paymentId,
      gatewayOrderId: orderId,
      amountPaidPaise: 0,
      status: isValid ? 'PAID' : 'FAILED',
      failureReason: isValid ? undefined : 'Sandbox signature verification failed',
    };
  }
}
