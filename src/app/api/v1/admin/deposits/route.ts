import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth-middleware";
import { DepositService } from "@/services/deposit.service";
import { depositQuerySchema } from "@/lib/validations/deposit.schema";
import { ApiResponse, handleApiError } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    await requireRole(req, ["ADMIN", "SUPER_ADMIN"]);
    const { searchParams } = new URL(req.url);

    const queryParams = {
      page: searchParams.get("page") || undefined,
      limit: searchParams.get("limit") || undefined,
      status: searchParams.get("status") || undefined,
      gateway: searchParams.get("gateway") || undefined,
      search: searchParams.get("search") || undefined,
    };

    const validated = depositQuerySchema.parse(queryParams);
    const result = await DepositService.getAdminDeposits(validated);

    return ApiResponse.success(result.deposits, "Admin deposits retrieved successfully", 200, result.pagination);
  } catch (error) {
    return handleApiError(error);
  }
}
