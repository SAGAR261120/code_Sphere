import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth-middleware";
import { StorageService } from "@/services/storage.service";
import { createSignedUrlSchema } from "@/lib/validations/order.schema";
import { ApiResponse, handleApiError } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const body = await req.json();
    const validatedData = createSignedUrlSchema.parse(body);

    // Verify file exists
    const file = await prisma.productFile.findUnique({
      where: { id: validatedData.productFileId },
      include: {
        version: {
          include: { product: true },
        },
      },
    });

    if (!file) {
      return ApiResponse.error("Product file not found", "FILE_NOT_FOUND", 404);
    }

    const productId = file.version.productId;

    // Verify user owns an active entitlement for this product
    const entitlement = await prisma.purchaseEntitlement.findUnique({
      where: {
        userId_productId: {
          userId: user.id,
          productId,
        },
      },
    });

    if (!entitlement) {
      return ApiResponse.error(
        "You do not have a purchase entitlement for this product file",
        "UNENTITLED_ACCESS",
        403
      );
    }

    if (entitlement.isRevoked) {
      return ApiResponse.error(
        `Your entitlement was revoked: ${entitlement.revocationReason || "License revoked"}`,
        "ENTITLEMENT_REVOKED",
        403
      );
    }

    if (entitlement.downloadCount >= entitlement.maxDownloads) {
      return ApiResponse.error(
        `Download quota reached (${entitlement.maxDownloads} downloads limit).`,
        "DOWNLOAD_QUOTA_EXCEEDED",
        429
      );
    }

    // Generate 15-minute signed token
    const token = StorageService.generateDownloadToken({
      fileId: file.id,
      userId: user.id,
      entitlementId: entitlement.id,
      expiresInSeconds: 900, // 15 minutes
    });

    const downloadUrl = `/api/v1/downloads/${token}`;
    const expiresAt = new Date(Date.now() + 900 * 1000).toISOString();

    return ApiResponse.success(
      {
        downloadUrl,
        fileName: file.fileName,
        fileSizeBytes: Number(file.fileSizeBytes),
        mimeType: file.mimeType,
        expiresAt,
        remainingDownloads: entitlement.maxDownloads - entitlement.downloadCount,
      },
      "Signed download URL generated successfully (valid for 15 minutes)",
      200
    );
  } catch (error) {
    return handleApiError(error);
  }
}
