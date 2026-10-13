import { NextRequest } from "next/server";
import { ProductService } from "@/services/product.service";
import { createProductVersionSchema } from "@/lib/validations/product.schema";
import { requireAuth } from "@/lib/auth-middleware";
import { ApiResponse, handleApiError } from "@/lib/api-response";

interface RouteParams {
  params: Promise<{ slug: string }>;
}

export async function POST(req: NextRequest, props: RouteParams) {
  try {
    const user = await requireAuth(req);
    const { slug } = await props.params;
    const product = await ProductService.getProductBySlug(slug, false);

    const body = await req.json();
    const validatedData = createProductVersionSchema.parse(body);

    const isAdmin = user.roles.some((r) => ["ADMIN", "SUPER_ADMIN"].includes(r));
    const version = await ProductService.addProductVersion(
      product.id,
      validatedData,
      user.id,
      isAdmin
    );

    return ApiResponse.success(
      version,
      `Version ${validatedData.version} successfully added to ${product.title}`,
      201
    );
  } catch (error) {
    return handleApiError(error);
  }
}
