import { NextRequest } from "next/server";
import { AdminControlService } from "@/services/admin-control.service";
import { adminReviewQuerySchema } from "@/lib/validations/admin.schema";
import { requireRole } from "@/lib/auth-middleware";
import { ApiResponse, handleApiError } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    await requireRole(req, ["ADMIN", "SUPER_ADMIN", "MODERATOR"]);
    const { searchParams } = new URL(req.url);

    const queryParams = {
      page: searchParams.get("page") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
      search: searchParams.get("search") ?? undefined,
      rating: searchParams.get("rating") ?? undefined,
      isApproved: searchParams.get("isApproved") ?? undefined,
      productId: searchParams.get("productId") ?? undefined,
    };

    const parsedQuery = adminReviewQuerySchema.parse(queryParams);
    const result = await AdminControlService.getAdminReviews(parsedQuery);

    return ApiResponse.success(
      result.reviews,
      "Product reviews retrieved for moderation",
      200,
      result.pagination
    );
  } catch (error) {
    return handleApiError(error);
  }
}
