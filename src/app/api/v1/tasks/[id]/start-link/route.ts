import { NextRequest } from 'next/server';
import { ShortlinkService } from '@/services/shortlink.service';
import { ApiResponse, ApiError, handleApiError } from '@/lib/api-response';
import { requireAuth } from '@/lib/auth-middleware';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(req);
    const { id: taskId } = await params;

    if (!taskId) {
      throw new ApiError(400, 'Task ID is required', 'BAD_REQUEST');
    }

    const clientIp =
      req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      req.headers.get('x-real-ip') ||
      undefined;
    const userAgent = req.headers.get('user-agent') || undefined;

    const origin =
      req.headers.get('origin') ||
      req.nextUrl.origin ||
      'http://localhost:3000';

    const result = await ShortlinkService.startShortlinkSession(
      taskId,
      user.id,
      clientIp,
      userAgent,
      origin
    );

    return ApiResponse.success(result, 'Short-link task session initiated', 201);
  } catch (error) {
    return handleApiError(error);
  }
}
