import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth-middleware";
import { AdminUserService } from "@/services/admin-user.service";
import { ApiResponse, handleApiError } from "@/lib/api-response";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, props: RouteParams) {
  try {
    await requireRole(req, ["ADMIN", "SUPER_ADMIN"]);
    const { id } = await props.params;

    const userDetails = await AdminUserService.getUserDetails(id);

    return ApiResponse.success(userDetails, "User details retrieved successfully", 200);
  } catch (error) {
    return handleApiError(error);
  }
}
