import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth-middleware";
import { WalletService } from "@/services/wallet.service";
import { repairWalletSchema } from "@/lib/validations/wallet.schema";
import { ApiResponse, handleApiError } from "@/lib/api-response";

export async function POST(req: NextRequest) {
  try {
    const admin = await requireRole(req, ["ADMIN", "SUPER_ADMIN"]);
    const body = await req.json();
    const validated = repairWalletSchema.parse(body);

    const clientIp = req.headers.get("x-forwarded-for") || "127.0.0.1";

    const result = await WalletService.repairWalletDiscrepancy(
      admin.id,
      validated.userId,
      validated.reason,
      clientIp
    );

    return ApiResponse.success(result, result.message, 200);
  } catch (error) {
    return handleApiError(error);
  }
}
