import { NextRequest } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth-middleware";
import { OrderService } from "@/services/order.service";
import { ProductService } from "@/services/product.service";
import { ApiResponse, handleApiError } from "@/lib/api-response";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;
    const user = await getAuthenticatedUser(req);

    const product = await ProductService.getProductBySlug(slug);
    if (!product) {
      return ApiResponse.error("Product not found", "PRODUCT_NOT_FOUND", 404);
    }

    const eligibility = await OrderService.checkPurchaseEligibility(
      user?.id || null,
      product.id
    );

    return ApiResponse.success(
      eligibility,
      "Purchase eligibility retrieved successfully",
      200
    );
  } catch (error) {
    return handleApiError(error);
  }
}
