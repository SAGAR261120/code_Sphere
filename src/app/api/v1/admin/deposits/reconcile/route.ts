import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth-middleware";
import { DepositService } from "@/services/deposit.service";
import { ApiResponse, handleApiError } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    await requireRole(req, ["ADMIN", "SUPER_ADMIN"]);
    const report = await DepositService.reconcilePaymentEvents();

    return ApiResponse.success(report, "Payment reconciliation report generated", 200);
  } catch (error) {
    return handleApiError(error);
  }
}
