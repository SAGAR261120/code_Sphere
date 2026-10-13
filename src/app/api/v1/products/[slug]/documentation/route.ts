import { NextRequest } from "next/server";
import { ProductService } from "@/services/product.service";
import { DocumentationService } from "@/services/documentation.service";
import { documentationQuerySchema } from "@/lib/validations/documentation.schema";
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
    const query = documentationQuerySchema.parse({
      page: searchParams.get("page") || undefined,
      limit: searchParams.get("limit") || undefined,
      documentType: searchParams.get("documentType") || undefined,
      isPublic: searchParams.get("isPublic") || undefined,
    });

    // Ensure default docs exist so products immediately have downloadable PDFs
    await DocumentationService.ensureDefaultDocs(product.id);

    const currentUser = await getAuthenticatedUser(req);
    const result = await DocumentationService.getProductDocuments(
      product.id,
      currentUser?.id,
      query
    );

    return ApiResponse.success(result);
  } catch (error) {
    return handleApiError(error);
  }
}
