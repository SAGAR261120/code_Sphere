import { NextRequest } from "next/server";
import { extractSessionToken } from "@/lib/auth-middleware";
import { AuthService } from "@/services/auth.service";
import { ApiResponse, handleApiError } from "@/lib/api-response";

export async function POST(req: NextRequest) {
  try {
    const token = extractSessionToken(req);
    if (token) {
      await AuthService.logout(token);
    }

    const response = ApiResponse.success(
      { loggedOut: true },
      "Logged out successfully",
      200
    );

    // Expire the session cookie immediately
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
