import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth-middleware";
import { TaskService } from "@/services/task.service";
import { ApiResponse, handleApiError } from "@/lib/api-response";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, props: RouteParams) {
  try {
    const admin = await requireRole(req, ["ADMIN", "SUPER_ADMIN"]);
    const { id } = await props.params;

    const duplicated = await TaskService.adminDuplicateTask(admin.id, id);

    return ApiResponse.success(
      duplicated,
      `Task duplicated successfully as "${duplicated.title}"`,
      201
    );
  } catch (error) {
    return handleApiError(error);
  }
}
