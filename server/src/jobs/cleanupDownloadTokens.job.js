import Order from '../modules/orders/order.model.js';

export async function cleanupDownloadTokens() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400 * 1000);
  const result = await Order.updateMany(
    { status: 'completed', downloadToken: { $ne: null }, createdAt: { $lt: thirtyDaysAgo } },
    { $unset: { downloadToken: '' } }
  );
  if (result.modifiedCount > 0) {
    console.log(`[Job] Cleared download tokens from ${result.modifiedCount} old orders`);
  }
}
