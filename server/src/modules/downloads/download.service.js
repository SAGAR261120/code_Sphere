import { verifyDownloadToken } from '../../utils/tokenUtils.js';
import { getSignedDownloadUrl } from '../../config/storage.js';
import Order from '../orders/order.model.js';
import Product from '../products/product.model.js';
import { ApiError } from '../../utils/ApiError.js';

export async function serveDownload(downloadToken, res) {
  let decoded;
  try {
    decoded = verifyDownloadToken(downloadToken);
  } catch {
    throw new ApiError(401, 'Invalid or expired download link. Request a new one from your dashboard.');
  }

  const order = await Order.findOne({
    _id: decoded.orderId,
    userId: decoded.userId,
    status: 'completed',
  }).select('+downloadToken');

  if (!order) throw new ApiError(404, 'Order not found');
  if (order.downloadCount >= order.maxDownloads) {
    throw new ApiError(403, 'Download limit reached. Contact support for assistance.');
  }

  const product = await Product.findById(decoded.productId).select('+fileKey fileName');
  if (!product?.fileKey) throw new ApiError(404, 'File not available. Contact support.');

  await Order.findByIdAndUpdate(order._id, { $inc: { downloadCount: 1 } });

  // Generate S3 presigned URL valid for 60 seconds
  const signedUrl = await getSignedDownloadUrl(product.fileKey, product.fileName || 'download.zip', 60);
  res.redirect(302, signedUrl);
}
