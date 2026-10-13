import { NextRequest } from "next/server";
import { RecommendationService } from "@/services/recommendation.service";
import { getAuthenticatedUser } from "@/lib/auth-middleware";
import { ApiResponse, handleApiError } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = Math.min(Math.max(Number(searchParams.get("limit") || 6), 1), 20);

    const currentUser = await getAuthenticatedUser(req);
    const recommendations = await RecommendationService.getPersonalizedRecommendations(
      currentUser?.id,
      limit
    );

    return ApiResponse.success({
      recommendations,
      count: recommendations.length,
      isPersonalized: !!currentUser,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
