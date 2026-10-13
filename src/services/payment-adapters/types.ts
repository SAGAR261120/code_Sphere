export interface PaymentOrderResult {
  gatewayOrderId: string;
  amountFiatPaise: number;
  currency: string;
  keyId: string;
  gateway: string;
}

export interface PaymentVerificationResult {
  isVerified: boolean;
  gatewayPaymentId: string;
  gatewayOrderId: string;
  amountPaidPaise: number;
  status: 'PAID' | 'FAILED';
  failureReason?: string;
}

export interface IPaymentProviderAdapter {
  readonly gatewayName: string;
  createOrder(amountFiatPaise: number, receiptId: string): Promise<PaymentOrderResult>;
  verifySignature(orderId: string, paymentId: string, signature: string, secret?: string): boolean;
  verifyPayment(orderId: string, paymentId: string, signature?: string): Promise<PaymentVerificationResult>;
}
