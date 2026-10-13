import { NextRequest } from "next/server";
import { AdminControlService } from "@/services/admin-control.service";
import { adminOrderQuerySchema } from "@/lib/validations/admin.schema";
import { requireRole } from "@/lib/auth-middleware";
import { ApiResponse, handleApiError } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    await requireRole(req, ["ADMIN", "SUPER_ADMIN"]);
    const { searchParams } = new URL(req.url);

    const queryParams = {
      page: searchParams.get("page") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
      search: searchParams.get("search") ?? undefined,
      status: searchParams.get("status") ?? undefined,
      paymentMethod: searchParams.get("paymentMethod") ?? undefined,
      productId: searchParams.get("productId") ?? undefined,
      userId: searchParams.get("userId") ?? undefined,
    };

    const parsedQuery = adminOrderQuerySchema.parse(queryParams);
    const result = await AdminControlService.getAdminOrders(parsedQuery);

    return ApiResponse.success(
      result.orders,
      "Admin order records retrieved successfully",
      200,
      result.pagination
    );
  } catch (error) {
    return handleApiError(error);
  }
}
