import { NextRequest } from "next/server";
import { AnalyticsService } from "@/services/analytics.service";
import { requireRole } from "@/lib/auth-middleware";
import { ApiResponse, handleApiError } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    await requireRole(req, ["ADMIN", "SUPER_ADMIN", "MODERATOR"]);
    const { searchParams } = new URL(req.url);

    const days = Math.min(365, Math.max(1, Number(searchParams.get("days") || 30)));
    const summary = await AnalyticsService.getAnalyticsSummary(days);

    return ApiResponse.success(summary, "Analytics summary retrieved");
  } catch (error) {
    return handleApiError(error);
  }
}
