import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth-middleware";
import { TaskService } from "@/services/task.service";
import { updateTaskSchema } from "@/lib/validations/task.schema";
import { ApiResponse, handleApiError } from "@/lib/api-response";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: NextRequest, props: RouteParams) {
  try {
    const admin = await requireRole(req, ["ADMIN", "SUPER_ADMIN"]);
    const { id } = await props.params;
    const body = await req.json();
    const validatedData = updateTaskSchema.parse(body);

    const task = await TaskService.adminUpdateTask(admin.id, id, validatedData);

    return ApiResponse.success(task, "Reward task updated successfully", 200);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(req: NextRequest, props: RouteParams) {
  try {
    const admin = await requireRole(req, ["ADMIN", "SUPER_ADMIN"]);
    const { id } = await props.params;

    const result = await TaskService.adminArchiveTask(admin.id, id);

    return ApiResponse.success(
      result,
      result.deleted ? "Task deleted successfully" : "Task archived successfully",
      200
    );
  } catch (error) {
    return handleApiError(error);
  }
}
