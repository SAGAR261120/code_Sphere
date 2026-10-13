import { NextRequest } from "next/server";
import { ReviewService } from "@/services/review.service";
import { requireRole } from "@/lib/auth-middleware";
import { ApiResponse, handleApiError } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    await requireRole(req, ["ADMIN", "SUPER_ADMIN", "MODERATOR"]);
    const { searchParams } = new URL(req.url);

    const status = searchParams.get("status") || "PENDING";
    const page = Math.max(1, Number(searchParams.get("page") || 1));
    const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") || 20)));

    const result = await ReviewService.getAdminReportedReviews(status, page, limit);

    return ApiResponse.success(
      result.reports,
      "Reported reviews retrieved",
      200,
      result.pagination
    );
  } catch (error) {
    return handleApiError(error);
  }
}
