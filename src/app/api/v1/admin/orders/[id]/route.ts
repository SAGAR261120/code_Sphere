import { NextRequest } from "next/server";
import { AdminControlService } from "@/services/admin-control.service";
import { requireRole } from "@/lib/auth-middleware";
import { ApiResponse, handleApiError } from "@/lib/api-response";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, props: RouteParams) {
  try {
    await requireRole(req, ["ADMIN", "SUPER_ADMIN"]);
    const { id } = await props.params;

    const order = await AdminControlService.getAdminOrderById(id);

    return ApiResponse.success(
      order,
      "Order details and entitlement logs retrieved successfully",
      200
    );
  } catch (error) {
    return handleApiError(error);
  }
}
