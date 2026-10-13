import { NextRequest } from 'next/server';
import { requireRole } from '@/lib/auth-middleware';
import { ShortlinkService } from '@/services/shortlink.service';
import { updateProviderSchema } from '@/lib/validations/shortlink.schema';
import { ApiResponse, handleApiError } from '@/lib/api-response';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireRole(req, ['ADMIN', 'SUPER_ADMIN']);
    const { id } = await params;
    const body = await req.json();
    const validatedData = updateProviderSchema.parse(body);

    const updated = await ShortlinkService.updateProvider(
      id,
      validatedData,
      admin.id
    );

    return ApiResponse.success(updated, 'Short-link provider updated successfully');
  } catch (error) {
    return handleApiError(error);
  }
}
