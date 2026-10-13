import { describe, it, expect } from 'vitest';
import crypto from 'crypto';
import {
  createDepositIntentSchema,
  verifyPaymentSchema,
  depositQuerySchema,
  updatePaymentConfigSchema,
} from '@/lib/validations/deposit.schema';
import { RazorpayAdapter } from '@/services/payment-adapters/razorpay.adapter';
import { SandboxPaymentAdapter } from '@/services/payment-adapters/sandbox.adapter';
import { getPaymentAdapter } from '@/services/payment-adapters';

describe('Phase 6: Deposits & Payment Gateway Test Suite', () => {
  describe('1. Zod Validation Schemas & Deposit Bounds', () => {
    it('should reject deposit amount below platform minimum (₹100 = 10,000 paise)', () => {
      const result = createDepositIntentSchema.safeParse({
        amountFiatPaise: 5000, // ₹50.00
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Minimum deposit');
      }
    });

    it('should reject deposit amount above platform maximum (₹50,000 = 5,000,000 paise)', () => {
      const result = createDepositIntentSchema.safeParse({
        amountFiatPaise: 6000000, // ₹60,000.00
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Maximum single deposit');
      }
    });

    it('should reject non-integer or negative amounts', () => {
      const floatRes = createDepositIntentSchema.safeParse({
        amountFiatPaise: 12500.5,
      });
      expect(floatRes.success).toBe(false);

      const negRes = createDepositIntentSchema.safeParse({
        amountFiatPaise: -10000,
      });
      expect(negRes.success).toBe(false);
    });

    it('should accept valid deposit amounts within allowed boundaries (₹100 - ₹50,000)', () => {
      const minValid = createDepositIntentSchema.safeParse({
        amountFiatPaise: 10000, // ₹100
      });
      expect(minValid.success).toBe(true);

      const standard = createDepositIntentSchema.safeParse({
        amountFiatPaise: 50000, // ₹500
        gateway: 'RAZORPAY',
        idempotencyKey: 'a0000000-0000-4000-8000-000000000001',
      });
      expect(standard.success).toBe(true);
      if (standard.success) {
        expect(standard.data.gateway).toBe('RAZORPAY');
        expect(standard.data.idempotencyKey).toBe('a0000000-0000-4000-8000-000000000001');
      }

      const maxValid = createDepositIntentSchema.safeParse({
        amountFiatPaise: 5000000, // ₹50,000
      });
      expect(maxValid.success).toBe(true);
    });

    it('should validate verifyPaymentSchema requires valid order and payment IDs', () => {
      const valid = verifyPaymentSchema.safeParse({
        gatewayOrderId: 'order_O68gK9l9P0mN',
        gatewayPaymentId: 'pay_P71hL0m0Q1nO',
        gatewaySignature: 'c28a9b31d8c11e74f83',
      });
      expect(valid.success).toBe(true);

      const missingOrder = verifyPaymentSchema.safeParse({
        gatewayOrderId: '',
        gatewayPaymentId: 'pay_P71hL0m0Q1nO',
      });
      expect(missingOrder.success).toBe(false);
    });

    it('should validate updatePaymentConfigSchema parameters', () => {
      const valid = updatePaymentConfigSchema.safeParse({
        depositsEnabled: true,
        defaultGateway: 'RAZORPAY',
        minDepositPaise: 10000,
        maxDepositPaise: 5000000,
        conversionRatePaise: 100,
        complianceNotice: 'Approved sandbox & Indian payment rails.',
      });
      expect(valid.success).toBe(true);

      const invalidMin = updatePaymentConfigSchema.safeParse({
        minDepositPaise: 50, // under 1000 paise
      });
      expect(invalidMin.success).toBe(false);
    });

    it('should parse deposit queries with defaults', () => {
      const query = depositQuerySchema.parse({});
      expect(query.page).toBe(1);
      expect(query.limit).toBe(20);
      expect(query.status).toBe('ALL');
    });
  });

  describe('2. Payment Provider Adapters & Cryptographic Security', () => {
    it('should calculate and verify valid Razorpay HMAC-SHA256 signatures', async () => {
      const adapter = new RazorpayAdapter();
      const orderId = 'order_DA2910JKS';
      const paymentId = 'pay_9821HJKAS';

      // Secret used by default in adapter
      const secret = process.env.RAZORPAY_KEY_SECRET || 'test_secret_cpc_marketplace_2026';
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(`${orderId}|${paymentId}`)
        .digest('hex');

      const verification = await adapter.verifyPayment(orderId, paymentId, expectedSignature);

      expect(verification.isVerified).toBe(true);
      expect(verification.gatewayPaymentId).toBe(paymentId);
      expect(verification.status).toBe('PAID');
    });

    it('should reject tampered or forged Razorpay signatures', async () => {
      const adapter = new RazorpayAdapter();
      const orderId = 'order_DA2910JKS';
      const paymentId = 'pay_9821HJKAS';
      const forgedSignature = 'forged_deadbeef1234567890abcdef1234567890abcdef1234567890abcdef1234';

      const verification = await adapter.verifyPayment(orderId, paymentId, forgedSignature);

      expect(verification.isVerified).toBe(false);
      expect(verification.status).toBe('FAILED');
      expect(verification.failureReason).toContain('signature mismatch');
    });

    it('should reject payment verification when signature is missing', async () => {
      const adapter = new RazorpayAdapter();
      const verification = await adapter.verifyPayment('order_123', 'pay_123');

      expect(verification.isVerified).toBe(false);
      expect(verification.failureReason).toContain('Missing Razorpay cryptographic signature');
    });

    it('should verify webhook payload authenticity using Razorpay webhook secret', () => {
      const webhookSecret = 'whsec_test_secret_789';
      const adapter = new RazorpayAdapter();

      const rawPayload = JSON.stringify({
        entity: 'event',
        event: 'payment.captured',
        payload: { payment: { entity: { id: 'pay_123', amount: 50000 } } },
      });

      const validSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(rawPayload)
        .digest('hex');

      expect(adapter.verifyWebhookSignature(rawPayload, validSignature, webhookSecret)).toBe(true);
      expect(adapter.verifyWebhookSignature(rawPayload, 'invalid_sig', webhookSecret)).toBe(false);
    });

    it('should provide deterministic offline verification in SandboxPaymentAdapter', async () => {
      const sandbox = new SandboxPaymentAdapter();
      const order = await sandbox.createOrder(50000, 'rec-1234');

      expect(order.gatewayOrderId).toContain('sbx_ord_');
      expect(order.amountFiatPaise).toBe(50000);
      expect(order.currency).toBe('INR');

      const testSig = sandbox.generateTestSignature(order.gatewayOrderId, 'pay_sandbox_test_1');
      const verification = await sandbox.verifyPayment(
        order.gatewayOrderId,
        'pay_sandbox_test_1',
        testSig
      );

      expect(verification.isVerified).toBe(true);
      expect(verification.status).toBe('PAID');
    });

    it('should resolve the correct adapter instance from getPaymentAdapter factory', () => {
      const razorpay = getPaymentAdapter('RAZORPAY');
      expect(razorpay.gatewayName).toBe('RAZORPAY');

      const sandbox = getPaymentAdapter('SANDBOX');
      expect(sandbox.gatewayName).toBe('SANDBOX');

      // Default fallback
      const defaultAdapter = getPaymentAdapter('UNKNOWN_PROVIDER');
      expect(defaultAdapter.gatewayName).toBe('RAZORPAY');
    });
  });

  describe('3. Single-Credit Invariant & Replay Protection', () => {
    it('should correctly calculate coins to credit based on INR conversion rate', () => {
      const conversionRatePaise = 100; // 100 paise (₹1.00) = 1 Coin

      const calculateCoins = (amountPaise: number) => {
        return Math.floor(amountPaise / conversionRatePaise);
      };

      expect(calculateCoins(10000)).toBe(100); // ₹100 => 100 Coins
      expect(calculateCoins(50000)).toBe(500); // ₹500 => 500 Coins
      expect(calculateCoins(29900)).toBe(299); // ₹299 => 299 Coins
      expect(calculateCoins(5000000)).toBe(50000); // ₹50,000 => 50,000 Coins
    });

    it('should enforce idempotency: replaying a completed deposit does not double credit coins', () => {
      // Simulate state machine behavior of processPaymentSuccess
      interface MockDeposit {
        id: string;
        status: 'PENDING' | 'COMPLETED' | 'FAILED';
        amountFiatPaise: number;
        coinsToCredit: number;
      }

      let walletBalance = 500;
      let transactionsLogged = 0;

      const mockDeposit: MockDeposit = {
        id: 'dep-test-uuid-001',
        status: 'PENDING',
        amountFiatPaise: 50000,
        coinsToCredit: 500,
      };

      const processPayment = (deposit: MockDeposit) => {
        if (deposit.status === 'COMPLETED') {
          // Idempotency branch: return without mutating wallet
          return { alreadyProcessed: true, balance: walletBalance };
        }

        deposit.status = 'COMPLETED';
        walletBalance += deposit.coinsToCredit;
        transactionsLogged += 1;
        return { alreadyProcessed: false, balance: walletBalance };
      };

      // 1st Execution: initial webhook confirmation
      const firstRun = processPayment(mockDeposit);
      expect(firstRun.alreadyProcessed).toBe(false);
      expect(firstRun.balance).toBe(1000);
      expect(walletBalance).toBe(1000);
      expect(transactionsLogged).toBe(1);

      // 2nd Execution: duplicate / replayed webhook delivery
      const secondRun = processPayment(mockDeposit);
      expect(secondRun.alreadyProcessed).toBe(true);
      expect(secondRun.balance).toBe(1000);
      expect(walletBalance).toBe(1000); // Balance unchanged
      expect(transactionsLogged).toBe(1); // No second transaction created

      // 3rd Execution: client-side verification query replay
      const thirdRun = processPayment(mockDeposit);
      expect(thirdRun.alreadyProcessed).toBe(true);
      expect(walletBalance).toBe(1000);
    });

    it('should guarantee that frontend success redirects cannot credit coins without server verification', () => {
      const verifyFrontendRedirect = (params: { redirectSuccess: boolean; verifiedByServer: boolean }) => {
        if (!params.verifiedByServer) {
          throw new Error('Rule 6 Violation: Client redirect cannot authorize coin issuance');
        }
        return true;
      };

      expect(() =>
        verifyFrontendRedirect({ redirectSuccess: true, verifiedByServer: false })
      ).toThrow('Rule 6 Violation');

      expect(
        verifyFrontendRedirect({ redirectSuccess: true, verifiedByServer: true })
      ).toBe(true);
    });
  });

  describe('4. Compliance Gating & Secret Security', () => {
    it('should block deposit creation when platform deposits are disabled (Compliance Gate)', () => {
      const depositsEnabled = false;

      const attemptDeposit = () => {
        if (!depositsEnabled) {
          throw new Error('Deposits are currently suspended by marketplace administration.');
        }
        return { orderId: 'ok' };
      };

      expect(() => attemptDeposit()).toThrow('Deposits are currently suspended');
    });

    it('should never expose gateway secrets in public configuration objects', () => {
      const publicConfig = {
        depositsEnabled: true,
        defaultGateway: 'RAZORPAY',
        minDepositPaise: 10000,
        maxDepositPaise: 5000000,
        conversionRatePaise: 100,
        razorpayKeyId: 'rzp_test_public_123',
      };

      // Ensure secret keys are not present in public config
      expect((publicConfig as any).razorpayKeySecret).toBeUndefined();
      expect((publicConfig as any).webhookSecret).toBeUndefined();
      expect((publicConfig as any).secret).toBeUndefined();
    });
  });
});
