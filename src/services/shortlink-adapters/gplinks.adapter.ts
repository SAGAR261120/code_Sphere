import {
  IShortlinkProviderAdapter,
  GenerateShortUrlParams,
  ShortlinkProviderConfig,
  ShortlinkCallbackPayload,
  CallbackVerificationResult,
} from './types';

/**
 * GPLinks Provider Adapter
 *
 * GPLinks Official Developer API:
 * - Link Generation: GET https://gplinks.com/api?api={API_KEY}&url={URL}&alias={ALIAS}
 * - Official Postbacks: GPLinks does NOT support real-time signed server-to-server callbacks
 *   or postbacks for individual conversion verification.
 * - Anti-Fraud Compliance (Rule 6 & 7): Automatic rewards are strictly disabled for GPLinks.
 *   Returns enter PENDING_VERIFICATION and require manual admin review.
 */
export class GPLinksAdapter implements IShortlinkProviderAdapter {
  readonly slug = 'gplinks';
  readonly name = 'GPLinks';
  readonly supportsAutomaticVerification = false;

  async generateShortUrl(
    params: GenerateShortUrlParams,
    config: ShortlinkProviderConfig
  ): Promise<string> {
    const alias = `cpc_${params.attemptId.slice(0, 8)}`;
    const destination = params.returnUrl;

    if (config.apiKey && !config.apiKey.startsWith('demo_')) {
      try {
        const apiUrl = new URL(config.baseUrl || 'https://gplinks.com/api');
        apiUrl.searchParams.set('api', config.apiKey);
        apiUrl.searchParams.set('url', destination);
        apiUrl.searchParams.set('alias', alias);

        const response = await fetch(apiUrl.toString(), {
          method: 'GET',
          headers: { Accept: 'application/json' },
          signal: AbortSignal.timeout(6000),
        });

        if (response.ok) {
          const data = (await response.json()) as { status?: string; shortenedUrl?: string };
          if (data.status === 'success' && data.shortenedUrl) {
            return data.shortenedUrl;
          }
        }
      } catch {
        // Fallback to formatted link if upstream API is unreachable
      }
    }

    // Default formatted shortlink incorporating alias and secure tracking target
    return `https://gplinks.co/${alias}?ref=${encodeURIComponent(destination)}`;
  }

  async verifyCallback(
    payload: ShortlinkCallbackPayload,
    _headers: Record<string, string>,
    _config: ShortlinkProviderConfig
  ): Promise<CallbackVerificationResult> {
    // Sanitize metadata, stripping sensitive query tokens
    const sanitizedMetadata: Record<string, any> = {};
    for (const [key, value] of Object.entries(payload)) {
      if (!['api', 'token', 'secret', 'password', 'key'].includes(key.toLowerCase())) {
        sanitizedMetadata[key] = value;
      }
    }

    return {
      isValid: false,
      attemptId: payload.attempt_id || payload.subid || payload.attemptId,
      providerEventId: payload.event_id || payload.click_id,
      verificationResult: 'UNSUPPORTED',
      rejectionReason:
        'GPLinks does not provide signed postback verification. Server rules mandate manual review or pending verification.',
      rewardStatus: 'PENDING_REVIEW',
      rawPayload: payload,
      sanitizedMetadata,
    };
  }
}
