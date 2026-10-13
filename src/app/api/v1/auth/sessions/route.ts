import { NextRequest } from "next/server";
import { requireAuth, extractSessionToken } from "@/lib/auth-middleware";
import { AuthService } from "@/services/auth.service";
import { ApiResponse, handleApiError } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const currentToken = extractSessionToken(req) || undefined;

    const sessions = await AuthService.getUserSessions(user.id, currentToken);

    return ApiResponse.success(sessions, "Active sessions retrieved successfully", 200);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const currentToken = extractSessionToken(req);

    if (!currentToken) {
      return ApiResponse.error("No active session token provided", "UNAUTHORIZED", 401);
    }

    const result = await AuthService.revokeAllOtherSessions(user.id, currentToken);

    return ApiResponse.success(result, result.message, 200);
  } catch (error) {
    return handleApiError(error);
  }
}
