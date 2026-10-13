import { NextRequest } from 'next/server';
import { ShortlinkService } from '@/services/shortlink.service';
import { ApiResponse, ApiError, handleApiError } from '@/lib/api-response';
import { getAuthenticatedUser } from '@/lib/auth-middleware';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: attemptId } = await params;
    if (!attemptId) {
      throw new ApiError(400, 'Attempt ID is required', 'BAD_REQUEST');
    }

    const user = await getAuthenticatedUser(req);
    const status = await ShortlinkService.getAttemptStatus(attemptId, user?.id);

    return ApiResponse.success(status, 'Attempt verification status retrieved');
  } catch (error) {
    return handleApiError(error);
  }
}
