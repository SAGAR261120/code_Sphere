import { NextRequest } from "next/server";
import { ProductService } from "@/services/product.service";
import { updateProductSchema } from "@/lib/validations/product.schema";
import { requireAuth } from "@/lib/auth-middleware";
import { ApiResponse, handleApiError } from "@/lib/api-response";

interface RouteParams {
  params: Promise<{ slug: string }>;
}

export async function GET(_req: NextRequest, props: RouteParams) {
  try {
    const { slug } = await props.params;
    const product = await ProductService.getProductBySlug(slug, true);
    const relatedProducts = await ProductService.getRelatedProducts(product.id, product.categoryId, 4);

    return ApiResponse.success(
      {
        product,
        relatedProducts,
      },
      "Product details and related items retrieved successfully",
      200
    );
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(req: NextRequest, props: RouteParams) {
  try {
    const user = await requireAuth(req);
    const { slug } = await props.params;
    const product = await ProductService.getProductBySlug(slug, false);

    const body = await req.json();
    const validatedData = updateProductSchema.parse(body);

    const isAdmin = user.roles.some((r) => ["ADMIN", "SUPER_ADMIN"].includes(r));
    const updated = await ProductService.updateProduct(
      product.id,
      validatedData,
      user.id,
      isAdmin
    );

    return ApiResponse.success(updated, "Product updated successfully");
  } catch (error) {
    return handleApiError(error);
  }
}
