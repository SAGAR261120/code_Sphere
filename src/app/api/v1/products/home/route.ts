import { NextRequest } from "next/server";
import { ProductService } from "@/services/product.service";
import { ApiResponse, handleApiError } from "@/lib/api-response";

export async function GET(_req: NextRequest) {
  try {
    const shelves = await ProductService.getMarketplaceHomeShelves();
    return ApiResponse.success(shelves, "Marketplace home shelves retrieved successfully");
  } catch (error) {
    return handleApiError(error);
  }
}
