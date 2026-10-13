import { NextRequest } from "next/server";
import { NotificationService } from "@/services/notification.service";
import { getAuthenticatedUser } from "@/lib/auth-middleware";
import { ApiResponse, handleApiError } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return ApiResponse.success({ unreadCount: 0 });
    }

    const unreadCount = await NotificationService.getUnreadCount(user.id);

    return ApiResponse.success({ unreadCount });
  } catch (error) {
    return handleApiError(error);
  }
}
