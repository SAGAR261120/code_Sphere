import { NextRequest } from "next/server";
import { ReviewService } from "@/services/review.service";
import { reportReviewSchema } from "@/lib/validations/interaction.schema";
import { requireAuth } from "@/lib/auth-middleware";
import { ApiResponse, handleApiError } from "@/lib/api-response";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, props: RouteParams) {
  try {
    const user = await requireAuth(req);
    const { id: reviewId } = await props.params;

    const body = await req.json();
    const validatedData = reportReviewSchema.parse(body);

    const report = await ReviewService.reportReview(reviewId, user.id, validatedData);

    return ApiResponse.success(
      report,
      "Review has been flagged for moderation review. Thank you for keeping our marketplace safe.",
      201
    );
  } catch (error) {
    return handleApiError(error);
  }
}
