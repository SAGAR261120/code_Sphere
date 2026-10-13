import {
  IShortlinkProviderAdapter,
  GenerateShortUrlParams,
  ShortlinkProviderConfig,
  ShortlinkCallbackPayload,
  CallbackVerificationResult,
} from './types';

/**
 * Manual Review / Custom Verification Adapter
 *
 * For campaigns or providers requiring administrative inspection or proof submission.
 * Automatic rewards are disabled; status remains PENDING_VERIFICATION.
 */
export class ManualReviewAdapter implements IShortlinkProviderAdapter {
  readonly slug = 'manual';
  readonly name = 'Manual Review';
  readonly supportsAutomaticVerification = false;

  async generateShortUrl(
    params: GenerateShortUrlParams,
    config: ShortlinkProviderConfig
  ): Promise<string> {
    if (config.baseUrl) {
      const url = new URL(config.baseUrl.startsWith('http') ? config.baseUrl : `https://${config.baseUrl}`);
      url.searchParams.set('attempt_id', params.attemptId);
      url.searchParams.set('return_url', params.returnUrl);
      return url.toString();
    }
    return params.returnUrl;
  }

  async verifyCallback(
    payload: ShortlinkCallbackPayload,
    _headers: Record<string, string>,
    _config: ShortlinkProviderConfig
  ): Promise<CallbackVerificationResult> {
    const sanitizedMetadata: Record<string, any> = {};
    for (const [key, value] of Object.entries(payload)) {
      if (!['secret', 'key', 'password'].includes(key.toLowerCase())) {
        sanitizedMetadata[key] = value;
      }
    }

    return {
      isValid: false,
      attemptId: payload.attempt_id || payload.subid || payload.attemptId,
      providerEventId: payload.event_id || payload.click_id,
      verificationResult: 'UNSUPPORTED',
      rejectionReason: 'Provider requires manual administrative verification',
      rewardStatus: 'PENDING_REVIEW',
      rawPayload: payload,
      sanitizedMetadata,
    };
  }
}
