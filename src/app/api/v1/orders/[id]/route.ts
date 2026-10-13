import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth-middleware";
import { OrderService } from "@/services/order.service";
import { ApiResponse, handleApiError } from "@/lib/api-response";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(req);
    const { id } = await context.params;

    const isAdmin = user.roles.some((r) => ["ADMIN", "SUPER_ADMIN"].includes(r));
    const order = await OrderService.getOrderById(user.id, id, isAdmin);

    return ApiResponse.success(order, "Order details retrieved successfully", 200);
  } catch (error) {
    return handleApiError(error);
  }
}
