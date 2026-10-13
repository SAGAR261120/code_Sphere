import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth-middleware";
import { WalletService } from "@/services/wallet.service";
import { ApiResponse, handleApiError } from "@/lib/api-response";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(req);
    const { id } = await params;

    const isAdmin = user.roles.includes('ADMIN') || user.roles.includes('SUPER_ADMIN');
    const transaction = await WalletService.getTransactionById(user.id, id, isAdmin);

    return ApiResponse.success(transaction, "Transaction details retrieved successfully", 200);
  } catch (error) {
    return handleApiError(error);
  }
}
