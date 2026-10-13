import { NextRequest } from "next/server";
import { ProductService } from "@/services/product.service";
import { RecommendationService } from "@/services/recommendation.service";
import { getAuthenticatedUser } from "@/lib/auth-middleware";
import { ApiResponse, handleApiError } from "@/lib/api-response";

interface RouteParams {
  params: Promise<{ slug: string }>;
}

export async function GET(req: NextRequest, props: RouteParams) {
  try {
    const { slug } = await props.params;
    const product = await ProductService.getProductBySlug(slug, false);

    const { searchParams } = new URL(req.url);
    const limit = Math.min(Math.max(Number(searchParams.get("limit") || 6), 1), 20);

    const currentUser = await getAuthenticatedUser(req);
    const recommendations = await RecommendationService.getRelatedProducts(
      product.id,
      currentUser?.id,
      limit
    );

    return ApiResponse.success({
      recommendations,
      count: recommendations.length,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
