import { NextRequest } from "next/server";
import { ReviewService } from "@/services/review.service";
import { requireRole } from "@/lib/auth-middleware";
import { ApiResponse, handleApiError } from "@/lib/api-response";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, props: RouteParams) {
  try {
    await requireRole(req, ["ADMIN", "SUPER_ADMIN", "MODERATOR"]);
    const { id } = await props.params;

    const dismissed = await ReviewService.dismissReport(id);

    return ApiResponse.success(dismissed, "Report dismissed successfully");
  } catch (error) {
    return handleApiError(error);
  }
}
