import { NextRequest } from "next/server";
import { AdminControlService } from "@/services/admin-control.service";
import { updatePlatformSettingsSchema } from "@/lib/validations/admin.schema";
import { requireRole } from "@/lib/auth-middleware";
import { ApiResponse, handleApiError } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    await requireRole(req, ["ADMIN", "SUPER_ADMIN"]);
    const settings = await AdminControlService.getPlatformSettings();

    return ApiResponse.success(
      settings,
      "Platform configuration settings retrieved successfully",
      200
    );
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const admin = await requireRole(req, ["SUPER_ADMIN"]);
    const body = await req.json();
    const validatedData = updatePlatformSettingsSchema.parse(body);

    const updated = await AdminControlService.updatePlatformSettings(
      admin.id,
      validatedData
    );

    return ApiResponse.success(
      updated,
      "Platform configuration updated with audited change log",
      200
    );
  } catch (error) {
    return handleApiError(error);
  }
}
