import crypto from 'crypto';
import {
  IShortlinkProviderAdapter,
  GenerateShortUrlParams,
  ShortlinkProviderConfig,
  ShortlinkCallbackPayload,
  CallbackVerificationResult,
} from './types';

/**
 * Signed Postback Provider Adapter (AdLinkFly / Generic HMAC-SHA256 Postbacks)
 *
 * Supports shortlink services that deliver signed server-to-server HTTP postbacks.
 * Enforces cryptographic HMAC-SHA256 signature verification, replay protection,
 * and timestamp freshness windows (15 minutes).
 */
export class SignedPostbackAdapter implements IShortlinkProviderAdapter {
  readonly slug = 'signed-postback';
  readonly name = 'Signed Postback Provider';
  readonly supportsAutomaticVerification = true;

  async generateShortUrl(
    params: GenerateShortUrlParams,
    config: ShortlinkProviderConfig
  ): Promise<string> {
    const base = config.baseUrl.replace(/\/$/, '');
    const url = new URL(base.startsWith('http') ? base : `https://${base}`);

    if (config.apiKey) {
      url.searchParams.set('api', config.apiKey);
    }
    url.searchParams.set('url', params.returnUrl);
    url.searchParams.set('subid', params.attemptId);
    if (config.campaignId) {
      url.searchParams.set('campaign', config.campaignId);
    }

    return url.toString();
  }

  async verifyCallback(
    payload: ShortlinkCallbackPayload,
    headers: Record<string, string>,
    config: ShortlinkProviderConfig
  ): Promise<CallbackVerificationResult> {
    // Sanitize metadata to exclude secret tokens
    const sanitizedMetadata: Record<string, any> = {};
    for (const [key, value] of Object.entries(payload)) {
      if (!['secret', 'key', 'webhooksecret', 'password'].includes(key.toLowerCase())) {
        sanitizedMetadata[key] = value;
      }
    }

    const attemptId = (payload.attempt_id || payload.subid || payload.attemptId || payload.click_id) as string | undefined;
    const providerEventId = (payload.event_id || payload.transaction_id || payload.eventId || payload.id) as string | undefined;
    const status = (payload.status || payload.event || 'completed') as string;
    const signature = (payload.signature || payload.sig || headers['x-provider-signature'] || headers['x-signature']) as string | undefined;
    const timestamp = payload.timestamp || payload.time;

    if (!attemptId) {
      return {
        isValid: false,
        verificationResult: 'MALFORMED',
        rejectionReason: 'Missing required attempt identifier (attempt_id / subid)',
        rewardStatus: 'FAILED',
        rawPayload: payload,
        sanitizedMetadata,
      };
    }

    if (!providerEventId) {
      return {
        isValid: false,
        attemptId,
        verificationResult: 'MALFORMED',
        rejectionReason: 'Missing required provider event identifier (event_id / transaction_id)',
        rewardStatus: 'FAILED',
        rawPayload: payload,
        sanitizedMetadata,
      };
    }

    if (!config.webhookSecret) {
      return {
        isValid: false,
        attemptId,
        providerEventId,
        verificationResult: 'INVALID_SIGNATURE',
        rejectionReason: 'Provider does not have a configured webhook verification secret',
        rewardStatus: 'FAILED',
        rawPayload: payload,
        sanitizedMetadata,
      };
    }

    if (!signature) {
      return {
        isValid: false,
        attemptId,
        providerEventId,
        verificationResult: 'INVALID_SIGNATURE',
        rejectionReason: 'Callback is missing cryptographic signature',
        rewardStatus: 'FAILED',
        rawPayload: payload,
        sanitizedMetadata,
      };
    }

    // Timestamp freshness validation (prevent replaying stale events > 15 minutes)
    if (timestamp) {
      const parsedTime = typeof timestamp === 'number'
        ? (timestamp < 1e11 ? timestamp * 1000 : timestamp)
        : parseInt(String(timestamp), 10) * (String(timestamp).length <= 10 ? 1000 : 1);

      if (!isNaN(parsedTime)) {
        const ageMs = Math.abs(Date.now() - parsedTime);
        if (ageMs > 15 * 60 * 1000) {
          return {
            isValid: false,
            attemptId,
            providerEventId,
            verificationResult: 'EXPIRED',
            rejectionReason: `Callback timestamp expired (${Math.round(ageMs / 1000)}s old > 900s limit)`,
            rewardStatus: 'FAILED',
            rawPayload: payload,
            sanitizedMetadata,
          };
        }
      }
    }

    // Cryptographic signature check:
    // Expected HMAC-SHA256 of canonical format: `${attemptId}:${providerEventId}:${status}`
    const canonicalMessage = `${attemptId}:${providerEventId}:${status}`;
    const expectedHmac = crypto
      .createHmac('sha256', config.webhookSecret)
      .update(canonicalMessage)
      .digest('hex');

    // Also check alternative raw payload HMAC for standard webhook providers
    const alternativeMessage = `${attemptId}:${providerEventId}`;
    const alternativeHmac = crypto
      .createHmac('sha256', config.webhookSecret)
      .update(alternativeMessage)
      .digest('hex');

    const cleanSignature = signature.trim().toLowerCase();
    const isCanonicalMatch = this.safeCompare(cleanSignature, expectedHmac.toLowerCase());
    const isAltMatch = this.safeCompare(cleanSignature, alternativeHmac.toLowerCase());

    if (!isCanonicalMatch && !isAltMatch) {
      return {
        isValid: false,
        attemptId,
        providerEventId,
        verificationResult: 'INVALID_SIGNATURE',
        rejectionReason: 'HMAC signature verification failed',
        rewardStatus: 'FAILED',
        rawPayload: payload,
        sanitizedMetadata,
      };
    }

    const payout = payload.payout ? parseFloat(String(payload.payout)) : undefined;

    return {
      isValid: true,
      attemptId,
      providerEventId,
      verificationResult: 'VERIFIED',
      rewardStatus: 'REWARDED',
      payout,
      rawPayload: payload,
      sanitizedMetadata,
    };
  }

  private safeCompare(a: string, b: string): boolean {
    if (a.length !== b.length) return false;
    const bufA = Buffer.from(a);
    const bufB = Buffer.from(b);
    return crypto.timingSafeEqual(bufA, bufB);
  }
}
