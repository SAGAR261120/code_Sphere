import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth-middleware";
import { UserService } from "@/services/user.service";
import { updateProfileSchema } from "@/lib/validations/user.schema";
import { ApiResponse, handleApiError } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const profile = await UserService.getProfile(user.id);

    return ApiResponse.success(profile, "Profile retrieved successfully", 200);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const body = await req.json();
    const validatedData = updateProfileSchema.parse(body);

    const updated = await UserService.updateProfile(user.id, validatedData);

    return ApiResponse.success(updated, "Profile updated successfully", 200);
  } catch (error) {
    return handleApiError(error);
  }
}
