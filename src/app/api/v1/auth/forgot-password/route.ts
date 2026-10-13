import { NextRequest } from "next/server";
import { forgotPasswordSchema } from "@/lib/validations/auth.schema";
import { AuthService } from "@/services/auth.service";
import { ApiResponse, handleApiError } from "@/lib/api-response";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validatedData = forgotPasswordSchema.parse(body);

    const result = await AuthService.forgotPassword(validatedData.email);

    return ApiResponse.success(result, result.message, 200);
  } catch (error) {
    return handleApiError(error);
  }
}
