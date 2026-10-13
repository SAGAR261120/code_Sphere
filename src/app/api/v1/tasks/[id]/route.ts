import { NextRequest } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth-middleware";
import { TaskService } from "@/services/task.service";
import { ApiResponse, handleApiError } from "@/lib/api-response";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, props: RouteParams) {
  try {
    const { id } = await props.params;
    const user = await getAuthenticatedUser(req);

    const task = await TaskService.getTaskBySlug(id, user?.id || null);

    return ApiResponse.success(task, "Task details loaded successfully", 200);
  } catch (error) {
    return handleApiError(error);
  }
}
