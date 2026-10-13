import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth-middleware";
import { DepositService } from "@/services/deposit.service";
import { createDepositIntentSchema } from "@/lib/validations/deposit.schema";
import { ApiResponse, handleApiError } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const { searchParams } = new URL(req.url);

    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);

    const result = await DepositService.getUserDeposits(user.id, page, limit);

    return ApiResponse.success(
      result.deposits,
      "Deposit history retrieved successfully",
      200,
      result.pagination
    );
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const body = await req.json();
    const validatedData = createDepositIntentSchema.parse(body);

    const deposit = await DepositService.createDepositIntent({
      userId: user.id,
      amountFiatPaise: validatedData.amountFiatPaise,
      gateway: validatedData.gateway,
      idempotencyKey: validatedData.idempotencyKey,
    });

    return ApiResponse.success(
      deposit,
      "Deposit intent created successfully. Proceed to gateway payment.",
      201
    );
  } catch (error) {
    return handleApiError(error);
  }
}
