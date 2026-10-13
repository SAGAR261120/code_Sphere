import { NextRequest } from "next/server";
import { DocumentationService } from "@/services/documentation.service";
import { requireRole } from "@/lib/auth-middleware";
import { ApiResponse, handleApiError } from "@/lib/api-response";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function DELETE(req: NextRequest, props: RouteParams) {
  try {
    await requireRole(req, ["ADMIN", "SUPER_ADMIN"]);
    const { id } = await props.params;

    const deleted = await DocumentationService.deleteDocument(id);

    return ApiResponse.success(deleted, "Documentation deleted successfully");
  } catch (error) {
    return handleApiError(error);
  }
}
