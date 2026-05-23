import Order from '../modules/orders/order.model.js';

export async function generateOrderNumber() {
  const year = new Date().getFullYear();
  const count = await Order.countDocuments();
  const padded = String(count + 1).padStart(5, '0');
  return `ORD-${year}-${padded}`;
}
