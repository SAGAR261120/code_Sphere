import { NextRequest } from 'next/server';
import { requireRole } from '@/lib/auth-middleware';
import { ShortlinkService } from '@/services/shortlink.service';
import { createProviderSchema } from '@/lib/validations/shortlink.schema';
import { ApiResponse, handleApiError } from '@/lib/api-response';

export async function GET(req: NextRequest) {
  try {
    await requireRole(req, ['ADMIN', 'SUPER_ADMIN']);
    const providers = await ShortlinkService.getProviders();

    return ApiResponse.success(
      providers,
      'Short-link providers loaded successfully'
    );
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireRole(req, ['ADMIN', 'SUPER_ADMIN']);
    const body = await req.json();
    const validatedData = createProviderSchema.parse(body);

    const provider = await ShortlinkService.createProvider(
      validatedData,
      admin.id
    );

    return ApiResponse.success(
      provider,
      'Short-link provider created successfully',
      201
    );
  } catch (error) {
    return handleApiError(error);
  }
}
