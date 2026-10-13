import { NextRequest, NextResponse } from "next/server";
import { DocumentationService } from "@/services/documentation.service";
import { getAuthenticatedUser } from "@/lib/auth-middleware";
import { handleApiError } from "@/lib/api-response";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, props: RouteParams) {
  try {
    const { id } = await props.params;
    const currentUser = await getAuthenticatedUser(req);

    const { buffer, fileName, mimeType } = await DocumentationService.getDocumentDownload(
      id,
      currentUser?.id,
      currentUser?.roles || []
    );

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": mimeType || "application/pdf",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Content-Length": buffer.byteLength.toString(),
        "Cache-Control": "private, no-cache, no-store, must-revalidate",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
