import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { rateLimiter, RATE_LIMIT_TIERS, RateLimitTier } from './lib/rate-limiter';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();

  // 1. Determine client identifier (IP + user-agent hash or default)
  const forwardedFor = request.headers.get('x-forwarded-for');
  const ip = forwardedFor ? forwardedFor.split(',')[0].trim() : '127.0.0.1';

  // 2. Apply rate limiting to /api/ routes
  if (pathname.startsWith('/api/')) {
    // Exempt health checks from rate limiting
    if (pathname === '/api/health' || pathname === '/api/ready') {
      const response = NextResponse.next();
      response.headers.set('x-request-id', requestId);
      return response;
    }

    let tier: RateLimitTier = RATE_LIMIT_TIERS.DEFAULT;
    let rateKey = `${ip}:${pathname}`;

    if (pathname.startsWith('/api/v1/auth/')) {
      tier = RATE_LIMIT_TIERS.AUTH;
      rateKey = `${ip}:auth`;
    } else if (
      pathname.includes('/checkout') ||
      pathname.startsWith('/api/v1/deposits') ||
      pathname.startsWith('/api/v1/wallet/adjust')
    ) {
      tier = RATE_LIMIT_TIERS.PAYMENT;
      rateKey = `${ip}:payment`;
    } else if (
      pathname.includes('/download') ||
      pathname.includes('/downloads/')
    ) {
      tier = RATE_LIMIT_TIERS.DOWNLOAD;
      rateKey = `${ip}:downloads`;
    } else if (pathname.startsWith('/api/v1/admin/')) {
      tier = RATE_LIMIT_TIERS.ADMIN;
      rateKey = `${ip}:admin`;
    }

    const result = rateLimiter.check(rateKey, tier);

    if (!result.allowed) {
      const retryAfterSec = Math.ceil(result.resetMs / 1000) || 1;
      return new NextResponse(
        JSON.stringify({
          success: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: `Rate limit exceeded. Too many requests. Please retry in ${retryAfterSec} seconds.`,
            retryAfterSeconds: retryAfterSec,
          },
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': String(retryAfterSec),
            'X-RateLimit-Limit': String(result.limit),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(Math.ceil((Date.now() + result.resetMs) / 1000)),
            'x-request-id': requestId,
          },
        }
      );
    }
  }

  // 3. Forward request with Correlation ID and Security Headers
  const response = NextResponse.next();

  // Attach Correlation ID
  response.headers.set('x-request-id', requestId);

  // Essential Production Security Headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), browsing-topics=()'
  );

  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, icons, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
