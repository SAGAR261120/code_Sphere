import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth-middleware";
import { WalletService } from "@/services/wallet.service";
import { ApiResponse, handleApiError } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const reconciliation = await WalletService.reconcileWallet(user.id);

    return ApiResponse.success(reconciliation, "Wallet ledger reconciliation complete", 200);
  } catch (error) {
    return handleApiError(error);
  }
}
