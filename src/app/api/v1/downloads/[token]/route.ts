import { NextRequest, NextResponse } from "next/server";
import { StorageService } from "@/services/storage.service";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/api-response";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await context.params;

    // 1. Verify cryptographic token signature and expiration
    const payload = StorageService.verifyDownloadToken(token);

    // 2. Fetch file and product metadata
    const file = await prisma.productFile.findUnique({
      where: { id: payload.fileId },
      include: {
        version: {
          include: { product: true },
        },
      },
    });

    if (!file) {
      return new NextResponse("File not found in storage catalog", { status: 404 });
    }

    const clientIp = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const userAgent = req.headers.get("user-agent") || "unknown";
    const presignedUrlExpiresAt = new Date(payload.exp * 1000);

    // 3. Atomically record DownloadEvent and increment entitlement download counter
    const { entitlement } = await StorageService.recordDownloadEvent({
      entitlementId: payload.entitlementId,
      userId: payload.userId,
      fileId: file.id,
      clientIp,
      userAgent,
      presignedUrlExpiresAt,
    });

    // 4. Generate verified software package archive buffer
    const packageBuffer = StorageService.generatePackageArchive({
      productTitle: file.version.product.title,
      productSlug: file.version.product.slug,
      version: file.version.version,
      licenseKey: entitlement.licenseKey,
      fileName: file.fileName,
    });

    // 5. Stream download with safe secure headers
    return new NextResponse(new Uint8Array(packageBuffer), {
      status: 200,
      headers: {
        "Content-Type": file.mimeType || "application/zip",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(file.fileName)}"`,
        "Content-Length": packageBuffer.byteLength.toString(),
        "Cache-Control": "private, no-cache, no-store, must-revalidate",
        "X-Content-Type-Options": "nosniff",
        "X-Download-Verification": "Verified-Entitlement",
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
