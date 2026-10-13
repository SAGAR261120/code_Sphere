import { NextRequest } from "next/server";
import { AdminControlService } from "@/services/admin-control.service";
import { requireRole } from "@/lib/auth-middleware";
import { ApiResponse, handleApiError } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    await requireRole(req, ["ADMIN", "SUPER_ADMIN"]);
    const metrics = await AdminControlService.getExecutiveDashboardMetrics();

    return ApiResponse.success(
      metrics,
      "Executive marketplace dashboard metrics retrieved successfully",
      200
    );
  } catch (error) {
    return handleApiError(error);
  }
}
