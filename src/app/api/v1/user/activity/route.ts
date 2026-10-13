import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth-middleware";
import { UserService } from "@/services/user.service";
import { ApiResponse, handleApiError } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const { searchParams } = new URL(req.url);

    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);

    const result = await UserService.getUserActivity(user.id, page, limit);

    return ApiResponse.success(
      result.activities,
      "User activity timeline retrieved successfully",
      200,
      result.pagination
    );
  } catch (error) {
    return handleApiError(error);
  }
}
