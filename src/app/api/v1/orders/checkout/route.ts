import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth-middleware";
import { OrderService } from "@/services/order.service";
import { checkoutSchema } from "@/lib/validations/order.schema";
import { ApiResponse, handleApiError } from "@/lib/api-response";

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const body = await req.json();
    const validatedData = checkoutSchema.parse(body);

    const result = await OrderService.checkoutOrder(user.id, validatedData);

    return ApiResponse.success(
      result,
      result.isIdempotentReplay
        ? "Order already completed (idempotent replay)"
        : "Order completed successfully and license entitlement granted",
      200
    );
  } catch (error) {
    return handleApiError(error);
  }
}
