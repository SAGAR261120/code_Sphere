import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth-middleware";
import { WalletService } from "@/services/wallet.service";
import { ApiResponse, handleApiError } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    await requireRole(req, ["ADMIN", "SUPER_ADMIN"]);
    const economy = await WalletService.getEconomyOverview();

    return ApiResponse.success(economy, "Economy overview retrieved successfully", 200);
  } catch (error) {
    return handleApiError(error);
  }
}
