import { NextRequest } from "next/server";
import { AdminControlService } from "@/services/admin-control.service";
import { adminReviewDeleteSchema } from "@/lib/validations/admin.schema";
import { requireRole } from "@/lib/auth-middleware";
import { ApiResponse, handleApiError } from "@/lib/api-response";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function DELETE(req: NextRequest, props: RouteParams) {
  try {
    const admin = await requireRole(req, ["ADMIN", "SUPER_ADMIN"]);
    const { id } = await props.params;

    // Reason can be in request body or query parameter
    let reason = "Abusive content removed by administrator";
    try {
      const body = await req.json();
      const validated = adminReviewDeleteSchema.parse(body);
      reason = validated.reason;
    } catch {
      const { searchParams } = new URL(req.url);
      const queryReason = searchParams.get("reason");
      if (queryReason && queryReason.length >= 5) {
        reason = queryReason;
      }
    }

    const result = await AdminControlService.deleteReview(admin.id, id, reason);

    return ApiResponse.success(
      result,
      "Review deleted and product ratings recalculated successfully",
      200
    );
  } catch (error) {
    return handleApiError(error);
  }
}
