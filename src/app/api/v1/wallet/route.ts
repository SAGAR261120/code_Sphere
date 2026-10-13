import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth-middleware";
import { WalletService } from "@/services/wallet.service";
import { walletQuerySchema } from "@/lib/validations/wallet.schema";
import { ApiResponse, handleApiError } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const { searchParams } = new URL(req.url);

    const queryParams = {
      page: searchParams.get("page") || undefined,
      limit: searchParams.get("limit") || undefined,
      type: searchParams.get("type") || undefined,
      direction: searchParams.get("direction") || undefined,
      search: searchParams.get("search") || undefined,
      startDate: searchParams.get("startDate") || undefined,
      endDate: searchParams.get("endDate") || undefined,
    };

    const validatedQuery = walletQuerySchema.parse(queryParams);

    const [wallet, ledger, reconciliation] = await Promise.all([
      WalletService.getWallet(user.id),
      WalletService.getLedger(user.id, validatedQuery),
      WalletService.reconcileWallet(user.id),
    ]);

    return ApiResponse.success(
      {
        wallet: {
          id: wallet.id,
          availableBalance: wallet.availableBalance,
          lockedBalance: wallet.lockedBalance,
          pendingBalance: wallet.pendingBalance,
          totalEarned: wallet.totalEarned,
          totalSpent: wallet.totalSpent,
          version: wallet.version,
        },
        reconciliation: {
          isConsistent: reconciliation.isConsistent,
          ledgerSum: reconciliation.ledgerSum,
          discrepancy: reconciliation.discrepancy,
          transactionCount: reconciliation.transactionCount,
        },
        transactions: ledger.entries,
      },
      "Wallet data retrieved successfully",
      200,
      ledger.pagination
    );
  } catch (error) {
    return handleApiError(error);
  }
}
