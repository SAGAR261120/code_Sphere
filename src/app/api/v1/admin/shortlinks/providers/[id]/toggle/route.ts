import { NextRequest } from 'next/server';
import { requireRole } from '@/lib/auth-middleware';
import { ShortlinkService } from '@/services/shortlink.service';
import { ApiResponse, handleApiError } from '@/lib/api-response';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireRole(req, ['ADMIN', 'SUPER_ADMIN']);
    const { id } = await params;

    const updated = await ShortlinkService.toggleProvider(id, admin.id);

    return ApiResponse.success(
      updated,
      `Provider ${updated.isEnabled ? 'enabled' : 'disabled'} successfully`
    );
  } catch (error) {
    return handleApiError(error);
  }
}
