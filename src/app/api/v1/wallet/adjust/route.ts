import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth-middleware";
import { WalletService } from "@/services/wallet.service";
import { adminAdjustCoinsSchema } from "@/lib/validations/wallet.schema";
import { ApiResponse, handleApiError } from "@/lib/api-response";

export async function POST(req: NextRequest) {
  try {
    const admin = await requireRole(req, ["ADMIN", "SUPER_ADMIN"]);
    const body = await req.json();
    const validatedData = adminAdjustCoinsSchema.parse(body);

    const clientIp = req.headers.get("x-forwarded-for") || "127.0.0.1";

    const transaction = await WalletService.adminAdjustCoins(
      admin.id,
      validatedData.userId,
      validatedData.amount,
      validatedData.reason,
      validatedData.idempotencyKey,
      clientIp
    );

    return ApiResponse.success(
      transaction,
      `Balance adjusted successfully (${validatedData.amount > 0 ? "+" : ""}${validatedData.amount} CPC Coins)`,
      200
    );
  } catch (error) {
    return handleApiError(error);
  }
}
