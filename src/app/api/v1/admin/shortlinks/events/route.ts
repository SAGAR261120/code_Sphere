import { NextRequest } from 'next/server';
import { requireRole } from '@/lib/auth-middleware';
import { ShortlinkService } from '@/services/shortlink.service';
import { callbackEventQuerySchema } from '@/lib/validations/shortlink.schema';
import { ApiResponse, handleApiError } from '@/lib/api-response';

export async function GET(req: NextRequest) {
  try {
    await requireRole(req, ['ADMIN', 'SUPER_ADMIN']);

    const { searchParams } = new URL(req.url);
    const query = callbackEventQuerySchema.parse({
      providerSlug: searchParams.get('providerSlug') || undefined,
      verificationResult: searchParams.get('verificationResult') || undefined,
      rewardStatus: searchParams.get('rewardStatus') || undefined,
      search: searchParams.get('search') || undefined,
      page: searchParams.get('page') || 1,
      limit: searchParams.get('limit') || 20,
    });

    const result = await ShortlinkService.getCallbackEvents(query);

    return ApiResponse.success(
      result.events,
      'Callback event logs loaded successfully',
      200,
      result.pagination
    );
  } catch (error) {
    return handleApiError(error);
  }
}
