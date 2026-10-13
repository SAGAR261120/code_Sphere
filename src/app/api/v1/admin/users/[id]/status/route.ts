import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth-middleware";
import { AdminUserService } from "@/services/admin-user.service";
import { updateUserStatusSchema } from "@/lib/validations/user.schema";
import { ApiResponse, handleApiError } from "@/lib/api-response";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PUT(req: NextRequest, props: RouteParams) {
  try {
    const admin = await requireRole(req, ["ADMIN", "SUPER_ADMIN"]);
    const { id } = await props.params;
    const body = await req.json();
    const validatedData = updateUserStatusSchema.parse(body);

    const clientIp = req.headers.get("x-forwarded-for") || "127.0.0.1";

    const result = await AdminUserService.setUserStatus(
      admin.id,
      id,
      validatedData.status,
      validatedData.reason,
      clientIp
    );

    return ApiResponse.success(result, `User status updated to ${validatedData.status}`, 200);
  } catch (error) {
    return handleApiError(error);
  }
}
