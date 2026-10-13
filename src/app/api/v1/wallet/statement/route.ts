import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth-middleware";
import { WalletService } from "@/services/wallet.service";
import { exportStatementSchema } from "@/lib/validations/wallet.schema";
import { ApiResponse, handleApiError } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const { searchParams } = new URL(req.url);

    const queryParams = {
      format: searchParams.get("format") || "csv",
      startDate: searchParams.get("startDate") || undefined,
      endDate: searchParams.get("endDate") || undefined,
      type: searchParams.get("type") || undefined,
    };

    const validated = exportStatementSchema.parse(queryParams);

    const result = await WalletService.generateStatement(
      user.id,
      validated.format,
      validated.startDate,
      validated.endDate,
      validated.type
    );

    if (result.format === "csv") {
      return new Response(result.data as string, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${result.filename}"`,
        },
      });
    }

    return ApiResponse.success(result.data, "Statement generated successfully", 200);
  } catch (error) {
    return handleApiError(error);
  }
}
