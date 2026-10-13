import { NextRequest } from "next/server";
import { DepositService } from "@/services/deposit.service";
import { ApiResponse, handleApiError } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    const config = await DepositService.getDepositConfig();
    return ApiResponse.success(config, "Deposit configuration retrieved", 200);
  } catch (error) {
    return handleApiError(error);
  }
}
