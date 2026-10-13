import { NextRequest } from "next/server";
import { requireAuth, extractSessionToken } from "@/lib/auth-middleware";
import { UserService } from "@/services/user.service";
import { accountDeletionSchema } from "@/lib/validations/user.schema";
import { ApiResponse, handleApiError } from "@/lib/api-response";

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const body = await req.json();
    const validatedData = accountDeletionSchema.parse(body);

    const result = await UserService.requestAccountDeletion(user.id, validatedData.reason);

    const response = ApiResponse.success(result, result.message, 200);

    // Clear session cookie immediately
    response.cookies.set("cpc_session", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      expires: new Date(0),
      path: "/",
    });

    return response;
  } catch (error) {
    return handleApiError(error);
  }
}
