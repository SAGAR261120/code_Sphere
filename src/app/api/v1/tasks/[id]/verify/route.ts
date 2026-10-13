import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth-middleware";
import { TaskService } from "@/services/task.service";
import { verifyTaskSchema } from "@/lib/validations/task.schema";
import { ApiResponse, handleApiError } from "@/lib/api-response";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, props: RouteParams) {
  try {
    const user = await requireAuth(req);
    const body = await req.json();
    const validatedData = verifyTaskSchema.parse(body);

    const result = await TaskService.verifyAttempt(
      user.id,
      validatedData.attemptId,
      validatedData.sessionToken,
      validatedData.callbackCode
    );

    return ApiResponse.success(
      result,
      `Task verified successfully! ${result.rewardCoins} CPC Coins added to your wallet.`,
      200
    );
  } catch (error) {
    return handleApiError(error);
  }
}
