import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth-middleware";
import { WalletService } from "@/services/wallet.service";
import { coinConfigSchema } from "@/lib/validations/wallet.schema";
import { ApiResponse, handleApiError } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    await requireRole(req, ["ADMIN", "SUPER_ADMIN"]);
    const config = await WalletService.getPlatformCoinConfig();

    return ApiResponse.success(config, "Platform coin configuration retrieved", 200);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const admin = await requireRole(req, ["SUPER_ADMIN"]);
    const body = await req.json();
    const validated = coinConfigSchema.parse(body);

    const clientIp = req.headers.get("x-forwarded-for") || "127.0.0.1";

    const updatedConfig = await WalletService.updatePlatformCoinConfig(
      admin.id,
      validated,
      clientIp
    );

    return ApiResponse.success(updatedConfig, "Platform coin configuration updated successfully", 200);
  } catch (error) {
    return handleApiError(error);
  }
}
