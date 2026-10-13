import { NextRequest } from "next/server";
import { DocumentationService } from "@/services/documentation.service";
import { createDocumentationSchema } from "@/lib/validations/documentation.schema";
import { requireRole } from "@/lib/auth-middleware";
import { ApiResponse, handleApiError } from "@/lib/api-response";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, props: RouteParams) {
  try {
    await requireRole(req, ["ADMIN", "SUPER_ADMIN"]);
    const { id: productId } = await props.params;

    const body = await req.json();
    const validated = createDocumentationSchema.parse({
      ...body,
      productId,
    });

    const result = await DocumentationService.createDocument(validated);

    return ApiResponse.success(result.doc, "Documentation created and PDF generated successfully", 201);
  } catch (error) {
    return handleApiError(error);
  }
}
