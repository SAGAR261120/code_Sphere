import { NextRequest } from "next/server";
import { DepositService } from "@/services/deposit.service";
import { ApiResponse, handleApiError } from "@/lib/api-response";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-razorpay-signature") || "";
    const gateway = "RAZORPAY";

    let payload: any;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return ApiResponse.error("Invalid JSON payload", "INVALID_PAYLOAD", 400);
    }

    const eventId = payload.id || `evt_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const eventType = payload.event || "payment.captured";

    // 1. Audit and record the raw webhook payload (idempotent upsert)
    await DepositService.recordWebhookEvent(
      gateway,
      eventId,
      eventType,
      payload,
      signature
    );

    // 2. Handle payment captured events
    if (eventType === "payment.captured" || eventType === "order.paid") {
      const paymentEntity = payload.payload?.payment?.entity || payload;
      const orderId = paymentEntity.order_id;
      const paymentId = paymentEntity.id;

      if (!orderId || !paymentId) {
        return ApiResponse.error("Missing order or payment identifiers in payload", "MALFORMED_WEBHOOK", 400);
      }

      const result = await DepositService.processPaymentSuccess({
        gatewayOrderId: orderId,
        gatewayPaymentId: paymentId,
        gatewaySignature: signature,
        rawPayload: payload,
      });

      return ApiResponse.success(
        result,
        result.alreadyProcessed
          ? "Payment already processed (idempotent replay)"
          : "Payment verified and coins credited",
        200
      );
    }

    // Acknowledge other event types (refunds, failures, etc.)
    return ApiResponse.success({ received: true }, `Event ${eventType} acknowledged`, 200);
  } catch (error) {
    return handleApiError(error);
  }
}
