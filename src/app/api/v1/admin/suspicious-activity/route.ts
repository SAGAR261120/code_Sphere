import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth-middleware";
import { AdminUserService } from "@/services/admin-user.service";
import { ApiResponse, handleApiError } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    await requireRole(req, ["ADMIN", "SUPER_ADMIN"]);
    const { searchParams } = new URL(req.url);

    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);

    const result = await AdminUserService.getSuspiciousActivity(page, limit);

    return ApiResponse.success(result, "Suspicious security activities retrieved", 200);
  } catch (error) {
    return handleApiError(error);
  }
}
