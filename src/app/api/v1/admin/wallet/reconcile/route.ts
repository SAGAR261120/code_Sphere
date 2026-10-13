import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth-middleware";
import { WalletService } from "@/services/wallet.service";
import { ApiResponse, handleApiError } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    await requireRole(req, ["ADMIN", "SUPER_ADMIN"]);
    const auditReport = await WalletService.reconcileAllWallets();

    return ApiResponse.success(auditReport, "System-wide wallet reconciliation complete", 200);
  } catch (error) {
    return handleApiError(error);
  }
}
