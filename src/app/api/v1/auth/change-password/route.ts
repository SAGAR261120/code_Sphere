import { NextRequest } from "next/server";
import { requireAuth, extractSessionToken } from "@/lib/auth-middleware";
import { changePasswordSchema } from "@/lib/validations/auth.schema";
import { AuthService } from "@/services/auth.service";
import { ApiResponse, handleApiError } from "@/lib/api-response";

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const body = await req.json();
    const validatedData = changePasswordSchema.parse(body);

    const currentToken = extractSessionToken(req) || undefined;

    const result = await AuthService.changePassword(
      user.id,
      validatedData.currentPassword,
      validatedData.newPassword,
      validatedData.revokeOtherSessions,
      currentToken
    );

    return ApiResponse.success(result, result.message, 200);
  } catch (error) {
    return handleApiError(error);
  }
}
