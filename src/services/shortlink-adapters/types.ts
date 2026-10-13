export interface ShortlinkProviderConfig {
  id: string;
  name: string;
  slug: string;
  baseUrl: string;
  apiKey?: string | null;
  webhookSecret?: string | null;
  campaignId?: string | null;
  permittedDomains: string[];
  verificationType: string; // 'SIGNED_POSTBACK' | 'API_POLL' | 'MANUAL_REVIEW'
  config?: Record<string, any> | null;
  isEnabled: boolean;
}

export interface GenerateShortUrlParams {
  attemptId: string;
  sessionToken: string;
  targetUrl: string;
  userId: string;
  returnUrl: string;
  taskSlug: string;
}

export interface ShortlinkCallbackPayload {
  [key: string]: any;
}

export interface CallbackVerificationResult {
  isValid: boolean;
  attemptId?: string;
  providerEventId?: string;
  verificationResult: 'VERIFIED' | 'REJECTED' | 'UNSUPPORTED' | 'INVALID_SIGNATURE' | 'MALFORMED' | 'EXPIRED';
  rejectionReason?: string;
  rewardStatus: 'REWARDED' | 'PENDING_REVIEW' | 'FAILED' | 'NONE';
  payout?: number;
  rawPayload: Record<string, any>;
  sanitizedMetadata: Record<string, any>;
}

export interface IShortlinkProviderAdapter {
  readonly slug: string;
  readonly name: string;
  readonly supportsAutomaticVerification: boolean;

  generateShortUrl(params: GenerateShortUrlParams, config: ShortlinkProviderConfig): Promise<string>;

  verifyCallback(
    payload: ShortlinkCallbackPayload,
    headers: Record<string, string>,
    config: ShortlinkProviderConfig
  ): Promise<CallbackVerificationResult>;
}
