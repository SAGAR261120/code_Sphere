import { NextRequest } from "next/server";
import { AdminControlService } from "@/services/admin-control.service";
import { adminRefundSchema } from "@/lib/validations/admin.schema";
import { requireRole } from "@/lib/auth-middleware";
import { ApiResponse, handleApiError } from "@/lib/api-response";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, props: RouteParams) {
  try {
    const admin = await requireRole(req, ["ADMIN", "SUPER_ADMIN"]);
    const { id } = await props.params;

    const body = await req.json();
    const validatedData = adminRefundSchema.parse(body);

    const result = await AdminControlService.processAdminRefund(
      admin.id,
      id,
      validatedData.reason
    );

    return ApiResponse.success(
      result,
      `Order #${result.order.orderNumber} successfully refunded. Coins restored and entitlement revoked.`,
      200
    );
  } catch (error) {
    return handleApiError(error);
  }
}
