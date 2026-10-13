import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-middleware";
import { StorageService } from "@/services/storage.service";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/api-response";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ entitlementId: string }> }
) {
  try {
    const user = await requireAuth(req);
    const { entitlementId } = await context.params;

    const entitlement = await prisma.purchaseEntitlement.findUnique({
      where: { id: entitlementId },
      include: {
        product: true,
        orderItem: {
          include: {
            order: true,
            version: true,
          },
        },
      },
    });

    if (!entitlement) {
      return new NextResponse("License entitlement not found", { status: 404 });
    }

    const isAdmin = user.roles.some((r) => ["ADMIN", "SUPER_ADMIN"].includes(r));
    if (!isAdmin && entitlement.userId !== user.id) {
      return new NextResponse("Unauthorized access to license certificate", { status: 403 });
    }

    if (entitlement.isRevoked) {
      return new NextResponse("This license certificate has been revoked", { status: 403 });
    }

    const pdfBuffer = StorageService.generatePdfCertificate({
      productTitle: entitlement.product.title,
      productSlug: entitlement.product.slug,
      version: entitlement.orderItem.version.version,
      licenseKey: entitlement.licenseKey,
      licenseType: entitlement.orderItem.licenseType,
      orderNumber: entitlement.orderItem.order.orderNumber,
      purchasedAt: entitlement.createdAt,
      userEmail: user.email,
    });

    const safeName = `CPC-License-${entitlement.product.slug}-${entitlement.licenseKey.slice(-8)}.pdf`;

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${safeName}"`,
        "Content-Length": pdfBuffer.byteLength.toString(),
        "Cache-Control": "private, no-cache, no-store, must-revalidate",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
