import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth-middleware";
import { OrderService } from "@/services/order.service";
import { orderQuerySchema } from "@/lib/validations/order.schema";
import { ApiResponse, handleApiError } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const url = new URL(req.url);

    const validatedQuery = orderQuerySchema.parse({
      page: url.searchParams.get("page") || 1,
      limit: url.searchParams.get("limit") || 20,
      status: url.searchParams.get("status") || "ALL",
    });

    const result = await OrderService.getUserOrders(
      user.id,
      validatedQuery.page,
      validatedQuery.limit,
      validatedQuery.status
    );

    return ApiResponse.success(
      result.orders,
      "Order history retrieved successfully",
      200,
      result.pagination
    );
  } catch (error) {
    return handleApiError(error);
  }
}
