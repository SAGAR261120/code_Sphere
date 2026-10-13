import { NextRequest } from "next/server";
import { NotificationService } from "@/services/notification.service";
import { requireAuth } from "@/lib/auth-middleware";
import { ApiResponse, handleApiError } from "@/lib/api-response";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: NextRequest, props: RouteParams) {
  try {
    const user = await requireAuth(req);
    const { id } = await props.params;

    const updated = await NotificationService.markAsRead(user.id, id);

    return ApiResponse.success(updated, "Notification marked as read");
  } catch (error) {
    return handleApiError(error);
  }
}
