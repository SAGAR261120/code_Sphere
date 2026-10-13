import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth-middleware";
import { DepositService } from "@/services/deposit.service";
import { ApiResponse, handleApiError } from "@/lib/api-response";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(req);
    const { id } = await params;

    const isAdmin = user.roles.includes("ADMIN") || user.roles.includes("SUPER_ADMIN");
    const deposit = await DepositService.getDepositById(id, user.id, isAdmin);

    return ApiResponse.success(deposit, "Deposit details retrieved successfully", 200);
  } catch (error) {
    return handleApiError(error);
  }
}
