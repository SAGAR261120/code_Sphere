import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth-middleware";
import { TaskService } from "@/services/task.service";
import { ApiResponse, handleApiError } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    await requireRole(req, ["ADMIN", "SUPER_ADMIN"]);

    const analytics = await TaskService.adminGetAnalytics();

    return ApiResponse.success(
      analytics,
      "Task analytics overview loaded successfully",
      200
    );
  } catch (error) {
    return handleApiError(error);
  }
}
