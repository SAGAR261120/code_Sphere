import { NextRequest } from "next/server";
import { AnalyticsService } from "@/services/analytics.service";
import { analyticsEventSchema } from "@/lib/validations/interaction.schema";
import { getAuthenticatedUser } from "@/lib/auth-middleware";
import { ApiResponse, handleApiError } from "@/lib/api-response";

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    const body = await req.json();
    const validated = analyticsEventSchema.parse(body);

    const event = await AnalyticsService.trackEvent({
      ...validated,
      userId: user?.id,
    });

    return ApiResponse.success({ tracked: true, id: event.id }, "Event recorded", 201);
  } catch (error) {
    return handleApiError(error);
  }
}
