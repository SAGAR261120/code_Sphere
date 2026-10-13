import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth-middleware";
import { OrderService } from "@/services/order.service";
import { refundRequestSchema } from "@/lib/validations/order.schema";
import { ApiResponse, handleApiError } from "@/lib/api-response";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(req);
    const { id } = await context.params;
    const body = await req.json();

    const validatedData = refundRequestSchema.parse(body);
    const isAdmin = user.roles.some((r) => ["ADMIN", "SUPER_ADMIN"].includes(r));

    const result = await OrderService.requestOrProcessRefund(
      user.id,
      id,
      validatedData.reason,
      isAdmin
    );

    return ApiResponse.success(
      result,
      `Refund processed successfully. ${result.refundedCoins} CPC Coins restored to wallet.`,
      200
    );
  } catch (error) {
    return handleApiError(error);
  }
}
