import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth-middleware";
import { AuditService } from "@/services/audit.service";
import { ApiResponse, handleApiError } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    await requireRole(req, ["ADMIN", "SUPER_ADMIN"]);
    const { searchParams } = new URL(req.url);

    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const targetType = searchParams.get("targetType") || undefined;
    const action = searchParams.get("action") || undefined;
    const adminId = searchParams.get("adminId") || undefined;

    const result = await AuditService.getLogs({
      page,
      limit,
      targetType,
      action,
      adminId,
    });

    return ApiResponse.success(
      result.logs,
      "Audit logs retrieved successfully",
      200,
      result.pagination
    );
  } catch (error) {
    return handleApiError(error);
  }
}
