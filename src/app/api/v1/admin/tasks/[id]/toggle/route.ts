import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth-middleware";
import { TaskService } from "@/services/task.service";
import { ApiResponse, handleApiError } from "@/lib/api-response";
import { z } from "zod";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const toggleSchema = z.object({
  isActive: z.boolean(),
});

export async function POST(req: NextRequest, props: RouteParams) {
  try {
    const admin = await requireRole(req, ["ADMIN", "SUPER_ADMIN"]);
    const { id } = await props.params;
    const body = await req.json();
    const { isActive } = toggleSchema.parse(body);

    const task = await TaskService.adminToggleTask(admin.id, id, isActive);

    return ApiResponse.success(
      task,
      `Task "${task.title}" ${isActive ? "resumed" : "paused"} successfully`,
      200
    );
  } catch (error) {
    return handleApiError(error);
  }
}
