import { NextRequest, NextResponse } from "next/server";
import { DocumentationService } from "@/services/documentation.service";
import { requireAuth } from "@/lib/auth-middleware";
import { handleApiError } from "@/lib/api-response";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, props: RouteParams) {
  try {
    const user = await requireAuth(req);
    const { id: orderId } = await props.params;

    const { buffer, fileName } = await DocumentationService.generateOrderReceiptPdf(
      orderId,
      user.id,
      user.roles
    );

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
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
