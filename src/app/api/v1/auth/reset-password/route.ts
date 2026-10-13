import { NextRequest } from "next/server";
import { resetPasswordSchema } from "@/lib/validations/auth.schema";
import { AuthService } from "@/services/auth.service";
import { ApiResponse, handleApiError } from "@/lib/api-response";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validatedData = resetPasswordSchema.parse(body);

    const result = await AuthService.resetPassword(validatedData.token, validatedData.password);

    return ApiResponse.success(result, result.message, 200);
  } catch (error) {
    return handleApiError(error);
  }
}
