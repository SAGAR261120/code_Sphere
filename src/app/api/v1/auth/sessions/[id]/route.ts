import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth-middleware";
import { AuthService } from "@/services/auth.service";
import { ApiResponse, handleApiError } from "@/lib/api-response";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function DELETE(req: NextRequest, props: RouteParams) {
  try {
    const user = await requireAuth(req);
    const { id } = await props.params;

    const result = await AuthService.revokeSession(user.id, id);

    return ApiResponse.success(result, result.message, 200);
  } catch (error) {
    return handleApiError(error);
  }
}
