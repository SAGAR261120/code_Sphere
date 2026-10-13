import { NextRequest } from "next/server";
import { getAuthenticatedUser, requireAuth } from "@/lib/auth-middleware";
import { TaskService } from "@/services/task.service";
import { startTaskSchema } from "@/lib/validations/task.schema";
import { ApiResponse, handleApiError } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    const dashboardData = await TaskService.getEarnDashboardData(user?.id || null);

    return ApiResponse.success(dashboardData, "Earn tasks dashboard loaded successfully", 200);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const body = await req.json();
    const validatedData = startTaskSchema.parse(body);

    const clientIp = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const userAgent = req.headers.get("user-agent") || "unknown";

    const attempt = await TaskService.startTaskAttempt(
      user.id,
      validatedData.taskId,
      clientIp,
      userAgent
    );

    return ApiResponse.success(
      attempt,
      "Task attempt started. Complete instructions and return to verify.",
      201
    );
  } catch (error) {
    return handleApiError(error);
  }
}
