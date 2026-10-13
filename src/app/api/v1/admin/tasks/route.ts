import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth-middleware";
import { TaskService } from "@/services/task.service";
import { adminTaskQuerySchema, createTaskSchema } from "@/lib/validations/task.schema";
import { ApiResponse, handleApiError } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    await requireRole(req, ["ADMIN", "SUPER_ADMIN"]);

    const { searchParams } = new URL(req.url);
    const query = adminTaskQuerySchema.parse({
      page: searchParams.get("page") || 1,
      limit: searchParams.get("limit") || 20,
      status: searchParams.get("status") || "ALL",
      category: searchParams.get("category") || undefined,
      search: searchParams.get("search") || undefined,
    });

    const result = await TaskService.adminGetTasks(query);

    return ApiResponse.success(
      result.tasks,
      "Administrative task list loaded successfully",
      200,
      result.pagination
    );
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireRole(req, ["ADMIN", "SUPER_ADMIN"]);
    const body = await req.json();
    const validatedData = createTaskSchema.parse(body);

    const task = await TaskService.adminCreateTask(admin.id, validatedData);

    return ApiResponse.success(task, "Reward task created successfully", 201);
  } catch (error) {
    return handleApiError(error);
  }
}
