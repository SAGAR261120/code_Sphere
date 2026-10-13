import { NextRequest } from "next/server";
import { AdminControlService } from "@/services/admin-control.service";
import { adminReviewModerateSchema } from "@/lib/validations/admin.schema";
import { requireRole } from "@/lib/auth-middleware";
import { ApiResponse, handleApiError } from "@/lib/api-response";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: NextRequest, props: RouteParams) {
  try {
    const admin = await requireRole(req, ["ADMIN", "SUPER_ADMIN", "MODERATOR"]);
    const { id } = await props.params;

    const body = await req.json();
    const validatedData = adminReviewModerateSchema.parse(body);

    const updated = await AdminControlService.moderateReview(
      admin.id,
      id,
      validatedData.isApproved,
      validatedData.reason
    );

    return ApiResponse.success(
      updated,
      `Review status updated to ${validatedData.isApproved ? "Approved" : "Hidden"}.`,
      200
    );
  } catch (error) {
    return handleApiError(error);
  }
}
