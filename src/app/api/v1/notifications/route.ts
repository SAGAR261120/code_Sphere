import { NextRequest } from "next/server";
import { NotificationService } from "@/services/notification.service";
import { notificationQuerySchema } from "@/lib/validations/interaction.schema";
import { requireAuth } from "@/lib/auth-middleware";
import { ApiResponse, handleApiError } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req);

    const { searchParams } = new URL(req.url);
    const query = notificationQuerySchema.parse({
      page: searchParams.get("page") || undefined,
      limit: searchParams.get("limit") || undefined,
      unreadOnly: searchParams.get("unreadOnly") || undefined,
    });

    const result = await NotificationService.getUserNotifications(
      user.id,
      query.page,
      query.limit,
      query.unreadOnly
    );

    return ApiResponse.success(result);
  } catch (error) {
    return handleApiError(error);
  }
}
