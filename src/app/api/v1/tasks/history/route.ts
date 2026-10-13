import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth-middleware";
import { TaskService } from "@/services/task.service";
import { ApiResponse, handleApiError } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const { searchParams } = new URL(req.url);

    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));

    const result = await TaskService.getUserCompletionHistory(user.id, page, limit);

    return ApiResponse.success(
      result.completions,
      "Task completion history retrieved successfully",
      200,
      result.pagination
    );
  } catch (error) {
    return handleApiError(error);
  }
}
