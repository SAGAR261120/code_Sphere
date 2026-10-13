import { NextRequest } from "next/server";
import { ProductService } from "@/services/product.service";
import { requireRole } from "@/lib/auth-middleware";
import { ApiResponse, handleApiError } from "@/lib/api-response";
import { ProductStatus } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    await requireRole(req, ["ADMIN", "SUPER_ADMIN", "MODERATOR"]);
    const { searchParams } = new URL(req.url);
    const statusParam = searchParams.get("status") as ProductStatus | null;

    const products = await ProductService.getAdminProducts(statusParam || undefined);

    return ApiResponse.success(products, "Admin product catalog retrieved successfully");
  } catch (error) {
    return handleApiError(error);
  }
}
