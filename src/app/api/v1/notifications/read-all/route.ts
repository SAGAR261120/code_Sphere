import { NextRequest } from "next/server";
import { NotificationService } from "@/services/notification.service";
import { requireAuth } from "@/lib/auth-middleware";
import { ApiResponse, handleApiError } from "@/lib/api-response";

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);

    const result = await NotificationService.markAllAsRead(user.id);

    return ApiResponse.success(result, "All notifications marked as read");
  } catch (error) {
    return handleApiError(error);
  }
}
