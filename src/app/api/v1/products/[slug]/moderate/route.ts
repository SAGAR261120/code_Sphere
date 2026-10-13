import { NextRequest } from "next/server";
import { ProductService } from "@/services/product.service";
import { moderateProductSchema } from "@/lib/validations/product.schema";
import { requireRole } from "@/lib/auth-middleware";
import { ApiResponse, handleApiError } from "@/lib/api-response";

interface RouteParams {
  params: Promise<{ slug: string }>;
}

export async function POST(req: NextRequest, props: RouteParams) {
  try {
    const admin = await requireRole(req, ["ADMIN", "SUPER_ADMIN", "MODERATOR"]);
    const { slug } = await props.params;
    const product = await ProductService.getProductBySlug(slug, false);

    const body = await req.json();
    const validatedData = moderateProductSchema.parse(body);

    const ipAddress =
      req.headers.get("x-forwarded-for")?.split(",")[0] ||
      req.headers.get("x-real-ip") ||
      "127.0.0.1";

    const updated = await ProductService.updateProductStatus(
      admin.id,
      product.id,
      validatedData.status,
      validatedData.rejectionReason,
      ipAddress
    );

    return ApiResponse.success(
      updated,
      `Product status successfully updated to ${validatedData.status}`
    );
  } catch (error) {
    return handleApiError(error);
  }
}
