import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth-middleware";
import { DepositService } from "@/services/deposit.service";
import { verifyPaymentSchema } from "@/lib/validations/deposit.schema";
import { ApiResponse, handleApiError } from "@/lib/api-response";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth(req);
    await params; // consume params
    const body = await req.json();
    const validatedData = verifyPaymentSchema.parse(body);

    const result = await DepositService.processPaymentSuccess({
      gatewayOrderId: validatedData.gatewayOrderId,
      gatewayPaymentId: validatedData.gatewayPaymentId,
      gatewaySignature: validatedData.gatewaySignature,
    });

    return ApiResponse.success(
      result,
      result.alreadyProcessed
        ? "Payment was already completed."
        : "Payment verified successfully. CPC Coins credited to wallet.",
      200
    );
  } catch (error) {
    return handleApiError(error);
  }
}
