import { NextRequest } from "next/server";
import { ProductService } from "@/services/product.service";
import { productQuerySchema, createProductSchema } from "@/lib/validations/product.schema";
import { requireRole } from "@/lib/auth-middleware";
import { ApiResponse, handleApiError } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const queryParams = {
      page: searchParams.get("page") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
      category: searchParams.get("category") ?? undefined,
      platform: searchParams.get("platform") ?? undefined,
      pricing: searchParams.get("pricing") ?? undefined,
      minRating: searchParams.get("minRating") ?? undefined,
      minPrice: searchParams.get("minPrice") ?? undefined,
      maxPrice: searchParams.get("maxPrice") ?? undefined,
      sort: searchParams.get("sort") ?? undefined,
      search: searchParams.get("search") ?? undefined,
    };

    const parsedQuery = productQuerySchema.parse(queryParams);
    const result = await ProductService.getProducts(parsedQuery);

    return ApiResponse.success(
      result.products,
      "Products retrieved successfully",
      200,
      result.pagination
    );
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    // Only PUBLISHER or ADMIN can create products
    const user = await requireRole(req, ["PUBLISHER", "ADMIN", "SUPER_ADMIN"]);
    const body = await req.json();
    const validatedData = createProductSchema.parse(body);

    const product = await ProductService.createProduct(validatedData, user.id);

    return ApiResponse.success(
      product,
      "Product created in draft status",
      201
    );
  } catch (error) {
    return handleApiError(error);
  }
}
