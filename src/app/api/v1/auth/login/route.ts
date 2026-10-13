import { NextRequest } from "next/server";
import { AuthService } from "@/services/auth.service";
import { loginSchema } from "@/lib/validations/auth.schema";
import { ApiResponse, handleApiError } from "@/lib/api-response";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validatedData = loginSchema.parse(body);

    const clientIp = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const userAgent = req.headers.get("user-agent") || "unknown";

    const result = await AuthService.login(validatedData, clientIp, userAgent);

    const response = ApiResponse.success(
      result,
      "Signed in successfully",
      200
    );

    // Set secure session cookie
    response.cookies.set("cpc_session", result.sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      expires: result.expiresAt,
      path: "/",
    });

    return response;
  } catch (error) {
    return handleApiError(error);
  }
}
