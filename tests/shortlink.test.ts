import { describe, it, expect, beforeEach } from 'vitest';
import crypto from 'crypto';
import {
  getShortlinkAdapter,
  GPLinksAdapter,
  SignedPostbackAdapter,
  ManualReviewAdapter,
  ShortlinkProviderConfig,
} from '../src/services/shortlink-adapters';
import { createProviderSchema, taskReturnQuerySchema } from '../src/lib/validations/shortlink.schema';

describe('Phase 9 — Short-Link Provider Adapters & Anti-Fraud Security', () => {
  const mockGplinksConfig: ShortlinkProviderConfig = {
    id: 'prov-gplinks-1',
    name: 'GPLinks',
    slug: 'gplinks',
    baseUrl: 'https://gplinks.com/api',
    apiKey: 'gpl_test_key_123',
    permittedDomains: ['gplinks.co', 'gplinks.com'],
    verificationType: 'MANUAL_REVIEW',
    isEnabled: true,
  };

  const mockSignedConfig: ShortlinkProviderConfig = {
    id: 'prov-signed-1',
    name: 'Signed Postback Provider',
    slug: 'signed-postback',
    baseUrl: 'https://shortener-network.internal/link',
    apiKey: 'sp_key_456',
    webhookSecret: 'top_secret_hmac_signing_key_2026',
    permittedDomains: ['shortener-network.internal'],
    verificationType: 'SIGNED_POSTBACK',
    isEnabled: true,
  };

  describe('Provider Adapter Registry & Resolution', () => {
    it('should correctly resolve GPLinksAdapter for gplinks slug', () => {
      const adapter = getShortlinkAdapter('gplinks');
      expect(adapter).toBeInstanceOf(GPLinksAdapter);
      expect(adapter.slug).toBe('gplinks');
      expect(adapter.supportsAutomaticVerification).toBe(false);
    });

    it('should correctly resolve SignedPostbackAdapter for signed-postback and adlinkfly slugs', () => {
      const adapter1 = getShortlinkAdapter('signed-postback');
      expect(adapter1).toBeInstanceOf(SignedPostbackAdapter);
      expect(adapter1.supportsAutomaticVerification).toBe(true);

      const adapter2 = getShortlinkAdapter('adlinkfly');
      expect(adapter2).toBeInstanceOf(SignedPostbackAdapter);
    });

    it('should correctly resolve ManualReviewAdapter for manual slug', () => {
      const adapter = getShortlinkAdapter('manual');
      expect(adapter).toBeInstanceOf(ManualReviewAdapter);
      expect(adapter.supportsAutomaticVerification).toBe(false);
    });

    it('should fallback to SignedPostbackAdapter for unknown slugs', () => {
      const adapter = getShortlinkAdapter('unknown-provider');
      expect(adapter).toBeInstanceOf(SignedPostbackAdapter);
    });
  });

  describe('GPLinks Official API Compliance & No-Fake-Rewards Rule', () => {
    const adapter = new GPLinksAdapter();

    it('should generate compliant shortlink incorporating attempt reference and return URL', async () => {
      const link = await adapter.generateShortUrl(
        {
          attemptId: 'e89a3f21-7b91-4cf5-992a-3e1102948bb1',
          sessionToken: 'mock-session-token-321',
          targetUrl: 'https://cpcmarketplace.internal/earn',
          userId: 'user-1',
          returnUrl: 'https://cpcmarketplace.internal/tasks/return?attemptId=e89a3f21-7b91-4cf5-992a-3e1102948bb1',
          taskSlug: 'test-gplinks-task',
        },
        mockGplinksConfig
      );

      expect(link).toContain('https://gplinks.co/cpc_e89a3f21');
      expect(link).toContain('ref=');
    });

    it('should strictly refuse automatic reward issuance because GPLinks lacks signed postbacks', async () => {
      // Even if an attacker or mock tries to pass status: success
      const result = await adapter.verifyCallback(
        {
          attempt_id: 'e89a3f21-7b91-4cf5-992a-3e1102948bb1',
          status: 'success',
          api: 'attempted_secret_leak',
        },
        {},
        mockGplinksConfig
      );

      expect(result.isValid).toBe(false);
      expect(result.verificationResult).toBe('UNSUPPORTED');
      expect(result.rewardStatus).toBe('PENDING_REVIEW');
      expect(result.rejectionReason).toContain('GPLinks does not provide signed postback');
      // Verify sensitive api token is stripped from sanitized metadata
      expect(result.sanitizedMetadata.api).toBeUndefined();
    });
  });

  describe('Signed Postback HMAC-SHA256 Cryptographic Verification', () => {
    const adapter = new SignedPostbackAdapter();

    it('should accept valid HMAC-SHA256 signature and verify successfully', async () => {
      const attemptId = 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d';
      const providerEventId = 'evt_razor_postback_99182';
      const status = 'completed';

      // Canonical HMAC message: `${attemptId}:${providerEventId}:${status}`
      const canonicalMessage = `${attemptId}:${providerEventId}:${status}`;
      const validSignature = crypto
        .createHmac('sha256', mockSignedConfig.webhookSecret!)
        .update(canonicalMessage)
        .digest('hex');

      const result = await adapter.verifyCallback(
        {
          attempt_id: attemptId,
          event_id: providerEventId,
          status,
          signature: validSignature,
          timestamp: Date.now(),
        },
        {},
        mockSignedConfig
      );

      expect(result.isValid).toBe(true);
      expect(result.verificationResult).toBe('VERIFIED');
      expect(result.rewardStatus).toBe('REWARDED');
      expect(result.attemptId).toBe(attemptId);
      expect(result.providerEventId).toBe(providerEventId);
    });

    it('should reject callback with invalid or forged HMAC signature', async () => {
      const attemptId = 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d';
      const providerEventId = 'evt_forged_99182';

      const result = await adapter.verifyCallback(
        {
          attempt_id: attemptId,
          event_id: providerEventId,
          status: 'completed',
          signature: 'deadbeef_invalid_forged_hmac_signature_00000',
        },
        {},
        mockSignedConfig
      );

      expect(result.isValid).toBe(false);
      expect(result.verificationResult).toBe('INVALID_SIGNATURE');
      expect(result.rewardStatus).toBe('FAILED');
      expect(result.rejectionReason).toContain('HMAC signature verification failed');
    });

    it('should reject callback missing signature', async () => {
      const result = await adapter.verifyCallback(
        {
          attempt_id: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
          event_id: 'evt_no_sig_123',
        },
        {},
        mockSignedConfig
      );

      expect(result.isValid).toBe(false);
      expect(result.verificationResult).toBe('INVALID_SIGNATURE');
      expect(result.rejectionReason).toContain('missing cryptographic signature');
    });

    it('should reject replay attacks with expired timestamps (> 15 minutes old)', async () => {
      const attemptId = 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d';
      const providerEventId = 'evt_stale_123';
      const status = 'completed';
      const staleTimestamp = Date.now() - 20 * 60 * 1000; // 20 minutes ago

      const signature = crypto
        .createHmac('sha256', mockSignedConfig.webhookSecret!)
        .update(`${attemptId}:${providerEventId}:${status}`)
        .digest('hex');

      const result = await adapter.verifyCallback(
        {
          attempt_id: attemptId,
          event_id: providerEventId,
          status,
          signature,
          timestamp: staleTimestamp,
        },
        {},
        mockSignedConfig
      );

      expect(result.isValid).toBe(false);
      expect(result.verificationResult).toBe('EXPIRED');
      expect(result.rejectionReason).toContain('timestamp expired');
    });

    it('should reject malformed callbacks missing attempt identifier or event identifier', async () => {
      const result1 = await adapter.verifyCallback(
        { event_id: 'evt_1' },
        {},
        mockSignedConfig
      );
      expect(result1.isValid).toBe(false);
      expect(result1.verificationResult).toBe('MALFORMED');
      expect(result1.rejectionReason).toContain('attempt identifier');

      const result2 = await adapter.verifyCallback(
        { attempt_id: 'att_1' },
        {},
        mockSignedConfig
      );
      expect(result2.isValid).toBe(false);
      expect(result2.verificationResult).toBe('MALFORMED');
      expect(result2.rejectionReason).toContain('provider event identifier');
    });
  });

  describe('Validation Schemas & Return Route Defense', () => {
    it('should validate provider creation parameters correctly', () => {
      const valid = createProviderSchema.safeParse({
        name: 'AdLinkFly Custom Shortener',
        slug: 'adlinkfly-custom',
        baseUrl: 'https://adlinkfly.example.com/api',
        verificationType: 'SIGNED_POSTBACK',
        webhookSecret: 'secret_key_123',
        permittedDomains: ['adlinkfly.example.com'],
        isEnabled: true,
      });

      expect(valid.success).toBe(true);
    });

    it('should reject invalid provider slug format with capital letters or special symbols', () => {
      const invalid = createProviderSchema.safeParse({
        name: 'Bad Slug',
        slug: 'INVALID_SLUG_WITH_CAPS!',
        baseUrl: 'https://example.com',
      });

      expect(invalid.success).toBe(false);
    });

    it('should enforce UUID format on task return query parameter', () => {
      const valid = taskReturnQuerySchema.safeParse({
        attemptId: 'b78a2e10-4491-4b11-9fa2-8b89e0294101',
      });
      expect(valid.success).toBe(true);

      const invalid = taskReturnQuerySchema.safeParse({
        attemptId: 'not-a-valid-uuid',
      });
      expect(invalid.success).toBe(false);
    });
  });
});
