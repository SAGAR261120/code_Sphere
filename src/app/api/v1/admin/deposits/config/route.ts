import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth-middleware";
import { DepositService } from "@/services/deposit.service";
import { updatePaymentConfigSchema } from "@/lib/validations/deposit.schema";
import { ApiResponse, handleApiError } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    await requireRole(req, ["ADMIN", "SUPER_ADMIN"]);
    const config = await DepositService.getDepositConfig();

    return ApiResponse.success(config, "Payment configuration retrieved", 200);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const admin = await requireRole(req, ["SUPER_ADMIN"]);
    const body = await req.json();
    const validated = updatePaymentConfigSchema.parse(body);

    const clientIp = req.headers.get("x-forwarded-for") || "127.0.0.1";

    const updated = await DepositService.updateDepositConfig(
      admin.id,
      validated,
      clientIp
    );

    return ApiResponse.success(updated, "Payment gateway configuration updated successfully", 200);
  } catch (error) {
    return handleApiError(error);
  }
}
