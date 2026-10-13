import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth-middleware";
import { AdminUserService } from "@/services/admin-user.service";
import { userQuerySchema } from "@/lib/validations/user.schema";
import { ApiResponse, handleApiError } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    await requireRole(req, ["ADMIN", "SUPER_ADMIN"]);
    const { searchParams } = new URL(req.url);

    const queryParams = {
      page: searchParams.get("page") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
      search: searchParams.get("search") ?? undefined,
      status: searchParams.get("status") ?? undefined,
      role: searchParams.get("role") ?? undefined,
      sort: searchParams.get("sort") ?? undefined,
    };

    const parsedQuery = userQuerySchema.parse(queryParams);
    const result = await AdminUserService.listUsers(parsedQuery);

    return ApiResponse.success(
      result.users,
      "Users retrieved successfully",
      200,
      result.pagination
    );
  } catch (error) {
    return handleApiError(error);
  }
}
