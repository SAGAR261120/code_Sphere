import { NextRequest } from 'next/server';
import { ShortlinkService } from '@/services/shortlink.service';
import { ApiResponse, handleApiError } from '@/lib/api-response';

async function handleCallback(
  req: NextRequest,
  paramsPromise: Promise<{ provider: string }>
) {
  try {
    const { provider } = await paramsPromise;
    const clientIp =
      req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      req.headers.get('x-real-ip') ||
      undefined;

    // Collect headers into lowercase map
    const headers: Record<string, string> = {};
    req.headers.forEach((val, key) => {
      headers[key.toLowerCase()] = val;
    });

    // Merge query parameters and body
    const payload: Record<string, any> = {};
    req.nextUrl.searchParams.forEach((val, key) => {
      payload[key] = val;
    });

    if (req.method === 'POST') {
      const contentType = req.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        try {
          const body = await req.json();
          if (body && typeof body === 'object') {
            Object.assign(payload, body);
          }
        } catch {
          // JSON parsing failed, rely on query params
        }
      } else if (contentType.includes('application/x-www-form-urlencoded')) {
        try {
          const formData = await req.formData();
          formData.forEach((val, key) => {
            if (typeof val === 'string') {
              payload[key] = val;
            }
          });
        } catch {
          // Form parsing failed
        }
      }
    }

    const result = await ShortlinkService.processCallback(
      provider,
      payload,
      headers,
      clientIp
    );

    return ApiResponse.success(result, 'Callback processed');
  } catch (error) {
    return handleApiError(error);
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  return handleCallback(req, params);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  return handleCallback(req, params);
}
