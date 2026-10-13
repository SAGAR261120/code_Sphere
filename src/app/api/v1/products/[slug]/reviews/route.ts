import { NextRequest } from "next/server";
import { ProductService } from "@/services/product.service";
import { ReviewService } from "@/services/review.service";
import { reviewQuerySchema, submitReviewSchema } from "@/lib/validations/interaction.schema";
import { requireAuth, getAuthenticatedUser } from "@/lib/auth-middleware";
import { ApiResponse, handleApiError } from "@/lib/api-response";

interface RouteParams {
  params: Promise<{ slug: string }>;
}

export async function GET(req: NextRequest, props: RouteParams) {
  try {
    const { slug } = await props.params;
    const product = await ProductService.getProductBySlug(slug, false);

    const { searchParams } = new URL(req.url);
    const query = reviewQuerySchema.parse({
      page: searchParams.get("page") || undefined,
      limit: searchParams.get("limit") || undefined,
      sort: searchParams.get("sort") || undefined,
      rating: searchParams.get("rating") || undefined,
    });

    const reviewsData = await ReviewService.getProductReviews(product.id, query);

    // If user is authenticated, check their review eligibility & existing review
    let userEligibility = null;
    const currentUser = await getAuthenticatedUser(req);
    if (currentUser) {
      userEligibility = await ReviewService.checkReviewEligibility(product.id, currentUser.id);
    }

    return ApiResponse.success({
      ...reviewsData,
      userEligibility,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest, props: RouteParams) {
  try {
    const user = await requireAuth(req);
    const { slug } = await props.params;
    const product = await ProductService.getProductBySlug(slug, false);

    const body = await req.json();
    const validatedData = submitReviewSchema.parse(body);

    const result = await ReviewService.submitOrUpdateReview(
      product.id,
      user.id,
      validatedData
    );

    return ApiResponse.success(
      result,
      "Review saved successfully and verified.",
      201
    );
  } catch (error) {
    return handleApiError(error);
  }
}
