import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth-middleware";
import { AdminUserService } from "@/services/admin-user.service";
import { updateUserRoleSchema } from "@/lib/validations/user.schema";
import { ApiResponse, handleApiError } from "@/lib/api-response";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PUT(req: NextRequest, props: RouteParams) {
  try {
    const admin = await requireRole(req, ["SUPER_ADMIN"]);
    const { id } = await props.params;
    const body = await req.json();
    const validatedData = updateUserRoleSchema.parse(body);

    const clientIp = req.headers.get("x-forwarded-for") || "127.0.0.1";

    const result = await AdminUserService.setUserRole(
      admin.id,
      id,
      validatedData.role,
      validatedData.reason,
      clientIp
    );

    return ApiResponse.success(result, result.message, 200);
  } catch (error) {
    return handleApiError(error);
  }
}
