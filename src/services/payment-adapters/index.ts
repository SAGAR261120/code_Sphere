import { IPaymentProviderAdapter } from './types';
import { RazorpayAdapter } from './razorpay.adapter';
import { SandboxPaymentAdapter } from './sandbox.adapter';

export * from './types';
export * from './razorpay.adapter';
export * from './sandbox.adapter';

const razorpayAdapter = new RazorpayAdapter();
const sandboxAdapter = new SandboxPaymentAdapter();

export function getPaymentAdapter(gateway = 'RAZORPAY'): IPaymentProviderAdapter {
  const normalized = gateway.toUpperCase();
  if (normalized === 'SANDBOX') {
    return sandboxAdapter;
  }
  return razorpayAdapter;
}
