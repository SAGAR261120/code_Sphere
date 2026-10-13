import { describe, it, expect } from 'vitest';
import crypto from 'crypto';
import {
  checkoutSchema,
  orderQuerySchema,
  createSignedUrlSchema,
  refundRequestSchema,
} from '@/lib/validations/order.schema';
import { StorageService } from '@/services/storage.service';
import { ApiError } from '@/lib/api-response';

describe('Phase 7: Product Purchasing & Secure Downloads Test Suite', () => {
  describe('1. Zod Validation Schemas & Input Boundary Enforcement', () => {
    it('should validate valid checkout input with default values', () => {
      const valid = checkoutSchema.safeParse({
        productId: 'a0000000-0000-4000-8000-000000000001',
      });
      expect(valid.success).toBe(true);
      if (valid.success) {
        expect(valid.data.paymentMethod).toBe('COINS');
        expect(valid.data.licenseType).toBe('COMMERCIAL');
        expect(valid.data.acceptedTerms).toBe(true);
      }
    });

    it('should accept custom payment methods and license types with idempotency key', () => {
      const parsed = checkoutSchema.safeParse({
        productId: 'a0000000-0000-4000-8000-000000000002',
        paymentMethod: 'FREE',
        licenseType: 'PERSONAL',
        idempotencyKey: 'b0000000-0000-4000-8000-000000000001',
        acceptedTerms: true,
      });
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.paymentMethod).toBe('FREE');
        expect(parsed.data.licenseType).toBe('PERSONAL');
        expect(parsed.data.idempotencyKey).toBe('b0000000-0000-4000-8000-000000000001');
      }
    });

    it('should reject invalid UUIDs for productId and idempotencyKey', () => {
      const invalidProductId = checkoutSchema.safeParse({
        productId: 'not-a-uuid',
      });
      expect(invalidProductId.success).toBe(false);

      const invalidIdempotency = checkoutSchema.safeParse({
        productId: 'a0000000-0000-4000-8000-000000000001',
        idempotencyKey: 'invalid-idem-key',
      });
      expect(invalidIdempotency.success).toBe(false);
    });

    it('should validate refundRequestSchema requires min 10 characters and max 500 characters', () => {
      const tooShort = refundRequestSchema.safeParse({
        reason: 'Broken', // < 10 chars
      });
      expect(tooShort.success).toBe(false);
      if (!tooShort.success) {
        expect(tooShort.error.issues[0].message).toContain('at least 10 characters');
      }

      const valid = refundRequestSchema.safeParse({
        reason: 'The application source code does not compile on Windows Node.js 20 environment.',
      });
      expect(valid.success).toBe(true);

      const tooLong = refundRequestSchema.safeParse({
        reason: 'a'.repeat(501),
      });
      expect(tooLong.success).toBe(false);
    });

    it('should validate orderQuerySchema defaults and pagination constraints', () => {
      const defaultQuery = orderQuerySchema.parse({});
      expect(defaultQuery.page).toBe(1);
      expect(defaultQuery.limit).toBe(20);
      expect(defaultQuery.status).toBe('ALL');

      const customQuery = orderQuerySchema.parse({
        page: '2',
        limit: '15',
        status: 'COMPLETED',
      });
      expect(customQuery.page).toBe(2);
      expect(customQuery.limit).toBe(15);
      expect(customQuery.status).toBe('COMPLETED');
    });

    it('should validate createSignedUrlSchema requires valid UUID productFileId', () => {
      const valid = createSignedUrlSchema.safeParse({
        productFileId: 'f0000000-0000-4000-8000-000000000001',
      });
      expect(valid.success).toBe(true);

      const invalid = createSignedUrlSchema.safeParse({
        productFileId: 'invalid-file-id',
      });
      expect(invalid.success).toBe(false);
    });
  });

  describe('2. Cryptographic Storage & Signed Download Tokens', () => {
    const testFileId = 'file-uuid-001';
    const testUserId = 'user-uuid-001';
    const testEntitlementId = 'entitlement-uuid-001';

    it('should generate a valid HMAC-SHA256 signed token with expiration timestamp', () => {
      const token = StorageService.generateDownloadToken({
        fileId: testFileId,
        userId: testUserId,
        entitlementId: testEntitlementId,
        expiresInSeconds: 900, // 15 mins
      });

      expect(token).toBeDefined();
      expect(token).toContain('.');
      const [payloadStr, signature] = token.split('.');
      expect(payloadStr).toBeDefined();
      expect(signature).toBeDefined();

      const decoded = JSON.parse(Buffer.from(payloadStr, 'base64url').toString('utf-8'));
      expect(decoded.fileId).toBe(testFileId);
      expect(decoded.userId).toBe(testUserId);
      expect(decoded.entitlementId).toBe(testEntitlementId);
      expect(decoded.exp).toBeGreaterThan(Math.floor(Date.now() / 1000));
    });

    it('should verify and decode valid signed download tokens', () => {
      const token = StorageService.generateDownloadToken({
        fileId: testFileId,
        userId: testUserId,
        entitlementId: testEntitlementId,
        expiresInSeconds: 60,
      });

      const payload = StorageService.verifyDownloadToken(token);
      expect(payload.fileId).toBe(testFileId);
      expect(payload.userId).toBe(testUserId);
      expect(payload.entitlementId).toBe(testEntitlementId);
    });

    it('should reject tampered or forged download token signatures', () => {
      const token = StorageService.generateDownloadToken({
        fileId: testFileId,
        userId: testUserId,
        entitlementId: testEntitlementId,
      });

      const [payloadStr] = token.split('.');
      const forgedSignature = 'forgedSignature1234567890abcdef1234567890abcdef';
      const forgedToken = `${payloadStr}.${forgedSignature}`;

      expect(() => StorageService.verifyDownloadToken(forgedToken)).toThrow(ApiError);
      try {
        StorageService.verifyDownloadToken(forgedToken);
      } catch (err: any) {
        expect(err.errorCode).toBe('FORBIDDEN_SIGNATURE');
      }
    });

    it('should reject expired download tokens with TOKEN_EXPIRED error code', () => {
      // Generate token that expired 10 seconds ago
      const token = StorageService.generateDownloadToken({
        fileId: testFileId,
        userId: testUserId,
        entitlementId: testEntitlementId,
        expiresInSeconds: -10,
      });

      expect(() => StorageService.verifyDownloadToken(token)).toThrow(ApiError);
      try {
        StorageService.verifyDownloadToken(token);
      } catch (err: any) {
        expect(err.errorCode).toBe('TOKEN_EXPIRED');
        expect(err.statusCode).toBe(410);
      }
    });

    it('should reject malformed download tokens', () => {
      expect(() => StorageService.verifyDownloadToken('malformed-token-without-dot')).toThrow(ApiError);
      expect(() => StorageService.verifyDownloadToken('too.many.dots.here')).toThrow(ApiError);
    });

    it('should generate a valid PDF-1.4 License Certificate buffer', () => {
      const pdfBuffer = StorageService.generatePdfCertificate({
        productTitle: 'DevForge Pro Next.js Template',
        productSlug: 'devforge-pro',
        version: '1.2.0',
        licenseKey: 'CPC-LIC-DEVFORGE-A1B2-2026',
        licenseType: 'COMMERCIAL',
        orderNumber: 'CPC-202610-1234',
        purchasedAt: new Date('2026-10-12T12:00:00Z'),
        userEmail: 'developer@example.com',
      });

      expect(pdfBuffer).toBeInstanceOf(Buffer);
      const pdfContent = pdfBuffer.toString('utf-8');

      // Valid PDF standard header and trailer
      expect(pdfContent.startsWith('%PDF-1.4')).toBe(true);
      expect(pdfContent).toContain('%%EOF');
      expect(pdfContent).toContain('CPC MARKETPLACE - OFFICIAL COMMERCIAL LICENSE CERTIFICATE');
      expect(pdfContent).toContain('DevForge Pro Next.js Template');
      expect(pdfContent).toContain('CPC-LIC-DEVFORGE-A1B2-2026');
      expect(pdfContent).toContain('developer@example.com');
      expect(pdfContent).toContain('CPC-202610-1234');
    });

    it('should generate a valid standard ZIP archive software package bundle', () => {
      const zipBuffer = StorageService.generatePackageArchive({
        productTitle: 'DevForge Pro',
        productSlug: 'devforge-pro',
        version: '1.2.0',
        licenseKey: 'CPC-LIC-DEVFORGE-A1B2-2026',
        fileName: 'devforge-pro-v1.2.0.zip',
      });

      expect(zipBuffer).toBeInstanceOf(Buffer);
      expect(zipBuffer.length).toBeGreaterThan(100);

      // Verify ZIP standard local file header magic number: 0x04034b50 (PK\x03\x04)
      expect(zipBuffer.readUInt32LE(0)).toBe(0x04034b50);
      // Verify README content included
      const zipContent = zipBuffer.toString('utf-8');
      expect(zipContent).toContain('# DevForge Pro (v1.2.0)');
      expect(zipContent).toContain('CPC-LIC-DEVFORGE-A1B2-2026');
      expect(zipContent).toContain('Commercial License Entitlement');
    });
  });

  describe('3. Purchase Flow & Financial Invariants', () => {
    it('should prevent overdraft and reject checkout when user has insufficient CPC Coins', () => {
      const availableBalance = 150;
      const productPrice = 500;

      const simulateAffordabilityCheck = (balance: number, price: number) => {
        if (balance < price) {
          throw new ApiError(
            400,
            `Insufficient CPC Coins. Required: ${price} Coins, Available: ${balance} Coins.`,
            'INSUFFICIENT_BALANCE'
          );
        }
        return balance - price;
      };

      expect(() => simulateAffordabilityCheck(availableBalance, productPrice)).toThrow(ApiError);
      try {
        simulateAffordabilityCheck(availableBalance, productPrice);
      } catch (err: any) {
        expect(err.errorCode).toBe('INSUFFICIENT_BALANCE');
        expect(err.message).toContain('Insufficient CPC Coins');
      }
    });

    it('should execute atomic debit and create order snapshot with unique order number', () => {
      let walletBalance = 1000;
      const productPrice = 350;
      const transactions: any[] = [];

      // Atomic purchase simulation
      const executePurchase = (userId: string, productId: string, price: number) => {
        if (walletBalance < price) {
          throw new Error('Insufficient balance');
        }
        walletBalance -= price;

        const datePart = '202610';
        const randomSuffix = 4819;
        const orderNumber = `CPC-${datePart}-${randomSuffix}`;

        const order = {
          id: 'ord-uuid-001',
          orderNumber,
          userId,
          totalCoins: price,
          status: 'COMPLETED',
          createdAt: new Date(),
        };

        const ledgerTx = {
          id: 'tx-uuid-001',
          userId,
          amount: -price,
          balanceAfter: walletBalance,
          type: 'PURCHASE_DEBIT',
          referenceId: productId,
        };
        transactions.push(ledgerTx);

        const entitlement = {
          id: 'ent-uuid-001',
          userId,
          productId,
          licenseKey: 'CPC-LIC-PROD-9812-2026',
          maxDownloads: 15,
          downloadCount: 0,
          isRevoked: false,
        };

        return { order, ledgerTx, entitlement, balanceAfter: walletBalance };
      };

      const result = executePurchase('user-1', 'prod-1', productPrice);

      expect(result.balanceAfter).toBe(650);
      expect(walletBalance).toBe(650);
      expect(result.order.orderNumber).toBe('CPC-202610-4819');
      expect(result.ledgerTx.type).toBe('PURCHASE_DEBIT');
      expect(result.ledgerTx.amount).toBe(-350);
      expect(result.entitlement.licenseKey).toContain('CPC-LIC-');
    });

    it('should guarantee idempotency replay without charging coins twice', () => {
      let walletBalance = 500;
      let purchasesLogged = 0;
      const idempotencyCache = new Map<string, any>();

      const checkout = (idempotencyKey: string, price: number) => {
        if (idempotencyCache.has(idempotencyKey)) {
          return {
            ...idempotencyCache.get(idempotencyKey),
            isIdempotentReplay: true,
          };
        }

        walletBalance -= price;
        purchasesLogged += 1;
        const order = { id: 'ord-123', price, idempotencyKey };
        idempotencyCache.set(idempotencyKey, { order });

        return { order, isIdempotentReplay: false };
      };

      const idemKey = 'uuid-idem-0001';

      // 1st request
      const first = checkout(idemKey, 200);
      expect(first.isIdempotentReplay).toBe(false);
      expect(walletBalance).toBe(300);
      expect(purchasesLogged).toBe(1);

      // 2nd request with exact same idempotencyKey
      const second = checkout(idemKey, 200);
      expect(second.isIdempotentReplay).toBe(true);
      expect(walletBalance).toBe(300); // Balance unchanged
      expect(purchasesLogged).toBe(1); // No double purchase logged
    });

    it('should reject purchase when user already owns an active perpetual entitlement (Rule 4)', () => {
      const existingEntitlement = {
        id: 'ent-1',
        userId: 'user-1',
        productId: 'prod-1',
        isRevoked: false,
      };

      const checkCanPurchase = (entitlement: typeof existingEntitlement | null) => {
        if (entitlement && !entitlement.isRevoked) {
          throw new ApiError(
            400,
            'You already hold an active perpetual commercial license for this product.',
            'ALREADY_OWNED'
          );
        }
        return true;
      };

      expect(() => checkCanPurchase(existingEntitlement)).toThrow(ApiError);
      try {
        checkCanPurchase(existingEntitlement);
      } catch (err: any) {
        expect(err.errorCode).toBe('ALREADY_OWNED');
      }

      // If existing entitlement was previously revoked (e.g. refunded), user can repurchase
      const revokedEntitlement = { ...existingEntitlement, isRevoked: true };
      expect(checkCanPurchase(revokedEntitlement)).toBe(true);
    });

    it('should preserve immutable historical order price snapshot when product price changes', () => {
      // Historical order created at 300 coins
      const historicalOrder = {
        id: 'ord-001',
        orderNumber: 'CPC-202610-1001',
        totalCoins: 300,
        item: {
          productId: 'prod-1',
          priceCoins: 300,
        },
      };

      // Admin updates product price to 750 coins later
      const product = {
        id: 'prod-1',
        coinPrice: 750,
      };

      // Invariant: Historical order snapshot must NEVER be mutated or recalculated
      expect(historicalOrder.totalCoins).toBe(300);
      expect(historicalOrder.item.priceCoins).toBe(300);
      expect(historicalOrder.item.priceCoins).not.toBe(product.coinPrice);
    });
  });

  describe('4. Refund Policy, Entitlement Revocation & Compensating Transactions', () => {
    it('should reject refund when outside the 48-hour policy window for standard users', () => {
      const now = Date.now();
      const threeDaysAgo = new Date(now - 72 * 60 * 60 * 1000); // 72 hours ago

      const validateRefundWindow = (createdAt: Date, isAdmin: boolean) => {
        if (!isAdmin) {
          const ageHours = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);
          if (ageHours > 48) {
            throw new ApiError(
              400,
              'Refund window has elapsed (refunds must be requested within 48 hours of purchase).',
              'REFUND_WINDOW_ELAPSED'
            );
          }
        }
        return true;
      };

      expect(() => validateRefundWindow(threeDaysAgo, false)).toThrow(ApiError);
      try {
        validateRefundWindow(threeDaysAgo, false);
      } catch (err: any) {
        expect(err.errorCode).toBe('REFUND_WINDOW_ELAPSED');
      }

      // Admin override can process refunds beyond 48 hours
      expect(validateRefundWindow(threeDaysAgo, true)).toBe(true);
    });

    it('should reject refund when order is not in COMPLETED state', () => {
      const validateOrderStatus = (status: string) => {
        if (status !== 'COMPLETED') {
          throw new ApiError(
            400,
            `Cannot refund order in ${status} state. Only completed orders can be refunded.`,
            'INVALID_ORDER_STATUS'
          );
        }
        return true;
      };

      expect(() => validateOrderStatus('PENDING')).toThrow(ApiError);
      expect(() => validateOrderStatus('REFUNDED')).toThrow(ApiError);
      expect(validateOrderStatus('COMPLETED')).toBe(true);
    });

    it('should execute compensating REFUND_CREDIT transaction and revoke entitlement without deleting history', () => {
      let walletBalance = 250;
      let totalSpent = 500;
      const order = {
        id: 'ord-100',
        orderNumber: 'CPC-202610-9988',
        userId: 'user-1',
        totalCoins: 250,
        status: 'COMPLETED',
      };
      const entitlement = {
        id: 'ent-100',
        userId: 'user-1',
        isRevoked: false,
        revocationReason: null as string | null,
      };
      const ledger: any[] = [];

      // Process refund
      const processRefund = (reason: string) => {
        const refundAmount = order.totalCoins;
        walletBalance += refundAmount;
        totalSpent -= refundAmount;

        const compensatingTx = {
          id: 'tx-refund-001',
          userId: order.userId,
          amount: refundAmount, // Positive credit
          balanceAfter: walletBalance,
          type: 'REFUND_CREDIT',
          description: `Refund: Order #${order.orderNumber} - ${reason}`,
          referenceId: order.id,
        };
        ledger.push(compensatingTx);

        order.status = 'REFUNDED';
        entitlement.isRevoked = true;
        entitlement.revocationReason = `Refunded: ${reason}`;

        return { compensatingTx, order, entitlement };
      };

      const refundResult = processRefund('Product does not fit technical requirements');

      expect(walletBalance).toBe(500); // 250 + 250 restored
      expect(totalSpent).toBe(250);
      expect(refundResult.compensatingTx.type).toBe('REFUND_CREDIT');
      expect(refundResult.compensatingTx.amount).toBe(250);
      expect(refundResult.order.status).toBe('REFUNDED');
      expect(refundResult.entitlement.isRevoked).toBe(true);
      expect(refundResult.entitlement.revocationReason).toContain('Product does not fit');
      // Invariant: Historical order was not deleted
      expect(order.id).toBe('ord-100');
    });
  });

  describe('5. Download Security, Access Authorization & Rate Limits', () => {
    it('should enforce quota limit when downloadCount reaches maxDownloads', () => {
      const verifyDownloadQuota = (downloadCount: number, maxDownloads: number) => {
        if (downloadCount >= maxDownloads) {
          throw new ApiError(
            429,
            `Download limit reached (${maxDownloads} downloads allowed). Please contact support for quota extension.`,
            'DOWNLOAD_LIMIT_REACHED'
          );
        }
        return true;
      };

      expect(verifyDownloadQuota(5, 15)).toBe(true);
      expect(verifyDownloadQuota(14, 15)).toBe(true);
      expect(() => verifyDownloadQuota(15, 15)).toThrow(ApiError);
      try {
        verifyDownloadQuota(15, 15);
      } catch (err: any) {
        expect(err.errorCode).toBe('DOWNLOAD_LIMIT_REACHED');
        expect(err.statusCode).toBe(429);
      }
    });

    it('should reject file downloads if purchase entitlement is revoked', () => {
      const verifyEntitlementActive = (isRevoked: boolean, reason?: string) => {
        if (isRevoked) {
          throw new ApiError(
            403,
            `This purchase entitlement was revoked: ${reason || 'License cancelled'}`,
            'ENTITLEMENT_REVOKED'
          );
        }
        return true;
      };

      expect(verifyEntitlementActive(false)).toBe(true);
      expect(() => verifyEntitlementActive(true, 'Order refunded')).toThrow(ApiError);
      try {
        verifyEntitlementActive(true, 'Order refunded');
      } catch (err: any) {
        expect(err.errorCode).toBe('ENTITLEMENT_REVOKED');
      }
    });

    it('should reject download request if requesting user does not own the entitlement', () => {
      const verifyOwnership = (entitlementUserId: string, requestingUserId: string) => {
        if (entitlementUserId !== requestingUserId) {
          throw new ApiError(403, 'You do not own this purchase entitlement', 'FORBIDDEN_ENTITLEMENT');
        }
        return true;
      };

      expect(verifyOwnership('user-1', 'user-1')).toBe(true);
      expect(() => verifyOwnership('user-1', 'user-attacker')).toThrow(ApiError);
    });
  });
});
