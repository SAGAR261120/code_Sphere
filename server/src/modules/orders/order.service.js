import mongoose from 'mongoose';
import Order from './order.model.js';
import Product from '../products/product.model.js';
import User from '../users/user.model.js';
import Coupon from '../payments/coupon.model.js';
import WalletTransaction from '../wallet/walletTransaction.model.js';
import { calculatePricing, spendCoins } from '../../utils/coinUtils.js';
import { generateOrderNumber } from '../../utils/generateOrderNumber.js';
import { generateDownloadToken, verifyDownloadToken } from '../../utils/tokenUtils.js';
import { createNotification } from '../notifications/notification.service.js';
import { sendEmail } from '../../config/email.js';
import { purchaseConfirmationTemplate } from '../../utils/emailTemplates.js';
import { ApiError } from '../../utils/ApiError.js';
import { MAX_DOWNLOAD_COUNT } from '../../config/constants.js';

export async function createOrder({ userId, productId, paymentMethod, couponCode, mixedOptionIndex }) {
  const session = await mongoose.startSession();
  try {
    return await session.withTransaction(async () => {
      const [user, product] = await Promise.all([
        User.findById(userId).session(session),
        Product.findById(productId).session(session),
      ]);

      if (!product || product.status !== 'active') throw new ApiError(404, 'Product not available');

      const alreadyPurchased = await Order.findOne({ userId, productId, status: 'completed' }).session(session);
      if (alreadyPurchased) throw new ApiError(409, 'You already own this product');

      // Resolve pricing
      let pricing = calculatePricing(product, paymentMethod, mixedOptionIndex);

      // Apply coupon
      if (couponCode) {
        const coupon = await Coupon.findOne({ code: couponCode.toUpperCase() }).session(session);
        if (coupon && coupon.isValid()) {
          const discount = coupon.calculateDiscount(pricing.moneyPaid);
          pricing.moneyPaid = Math.max(0, pricing.moneyPaid - discount);
          pricing.couponApplied = couponCode.toUpperCase();
          pricing.couponDiscount = discount;
          await Coupon.findByIdAndUpdate(coupon._id, { $inc: { currentUses: 1 } }, { session });
        }
      }

      // Validate balances
      if (pricing.coinsPaid > 0 && user.coinBalance < pricing.coinsPaid) {
        throw new ApiError(400, `Insufficient coins. Need ${pricing.coinsPaid}, have ${user.coinBalance}`);
      }
      if (pricing.moneyPaid > 0 && paymentMethod === 'wallet' && user.walletBalance < pricing.moneyPaid) {
        throw new ApiError(400, `Insufficient wallet balance. Need ₹${pricing.moneyPaid / 100}, have ₹${user.walletBalance / 100}`);
      }

      const orderNumber = await generateOrderNumber();
      const isImmediate = pricing.moneyPaid === 0 || paymentMethod === 'wallet' || paymentMethod === 'coins';

      // Deduct coins if needed
      if (pricing.coinsPaid > 0) {
        await spendCoins(userId, pricing.coinsPaid, null, 'Order', `Purchase: ${product.name}`, session);
      }

      // Deduct wallet if paying via wallet
      if (pricing.moneyPaid > 0 && paymentMethod === 'wallet') {
        await User.findByIdAndUpdate(userId, { $inc: { walletBalance: -pricing.moneyPaid } }, { session });
        await WalletTransaction.create([{
          userId,
          type: 'purchase',
          amount: -pricing.moneyPaid,
          balanceAfter: user.walletBalance - pricing.moneyPaid,
          description: `Purchase: ${product.name}`,
          referenceType: 'Order',
        }], { session });
      }

      const [order] = await Order.create([{
        orderNumber,
        userId,
        productId,
        pricing,
        paymentMethod: product.pricing.isFree ? 'free' : paymentMethod,
        paymentStatus: isImmediate ? 'paid' : 'pending',
        status: isImmediate ? 'completed' : 'pending',
      }], { session });

      let downloadToken = null;
      if (isImmediate) {
        downloadToken = generateDownloadToken(order._id, userId, productId);
        await Order.findByIdAndUpdate(order._id, { downloadToken }, { session });
        await Product.findByIdAndUpdate(productId, {
          $inc: { totalSales: 1, totalRevenueMoney: pricing.moneyPaid, totalRevenueCoins: pricing.coinsPaid },
        }, { session });

        await createNotification(userId, {
          type: 'purchase',
          title: 'Purchase Successful!',
          message: `${product.name} is ready to download.`,
          actionUrl: '/dashboard/downloads',
        });

        // Email (non-blocking)
        const downloadUrl = `${process.env.CLIENT_URL}/dashboard/downloads`;
        User.findById(userId).select('email name').then((u) => {
          if (u) sendEmail({
            to: u.email,
            subject: `Your purchase is ready: ${product.name}`,
            html: purchaseConfirmationTemplate(u.name, product.name, orderNumber, downloadUrl),
          }).catch(() => {});
        });
      }

      return { order, requiresPayment: !isImmediate, downloadToken };
    });
  } finally {
    await session.endSession();
  }
}

export async function getUserOrders(userId, page = 1) {
  const limit = 20;
  const skip = (page - 1) * limit;
  const [orders, total] = await Promise.all([
    Order.find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('productId', 'name thumbnail slug version'),
    Order.countDocuments({ userId }),
  ]);
  return { orders, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
}

export async function getOrderById(orderId, userId) {
  const order = await Order.findOne({ _id: orderId, userId })
    .populate('productId', 'name thumbnail slug version setupGuide');
  if (!order) throw new ApiError(404, 'Order not found');
  return order;
}

export async function getDownloadToken(orderId, userId) {
  const order = await Order.findOne({ _id: orderId, userId, status: 'completed' }).select('+downloadToken');
  if (!order) throw new ApiError(404, 'Order not found or not completed');
  if (order.downloadCount >= order.maxDownloads) {
    throw new ApiError(403, 'Download limit exceeded. Contact support.');
  }
  // Refresh token (always 24h from now)
  const newToken = generateDownloadToken(orderId, userId, order.productId);
  await Order.findByIdAndUpdate(orderId, { downloadToken: newToken });
  return newToken;
}

export async function completeOrderAfterPayment(orderId, paymentId, gateway) {
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const order = await Order.findById(orderId).session(session);
      if (!order || order.status !== 'pending') return;

      const downloadToken = generateDownloadToken(orderId, order.userId, order.productId);
      await Order.findByIdAndUpdate(orderId, {
        status: 'completed',
        paymentStatus: 'paid',
        paymentId,
        paymentGateway: gateway,
        downloadToken,
      }, { session });

      await Product.findByIdAndUpdate(order.productId, {
        $inc: { totalSales: 1, totalRevenueMoney: order.pricing.moneyPaid },
      }, { session });

      await createNotification(order.userId, {
        type: 'purchase',
        title: 'Payment Successful!',
        message: 'Your purchase is ready to download.',
        actionUrl: '/dashboard/downloads',
      });
    });
  } finally {
    await session.endSession();
  }
}

export async function adminGetAllOrders(page = 1, status, search) {
  const limit = 20;
  const skip = (page - 1) * limit;
  const filter = {};
  if (status) filter.status = status;
  if (search) filter.orderNumber = { $regex: search, $options: 'i' };
  const [orders, total] = await Promise.all([
    Order.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('userId', 'name email')
      .populate('productId', 'name'),
    Order.countDocuments(filter),
  ]);
  return { orders, total, totalPages: Math.ceil(total / limit) };
}

export async function processRefund(orderId, reason, adminId) {
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const order = await Order.findById(orderId).session(session);
      if (!order) throw new ApiError(404, 'Order not found');
      if (order.status === 'refunded') throw new ApiError(409, 'Order already refunded');

      // Refund money to wallet
      if (order.pricing.moneyPaid > 0) {
        await User.findByIdAndUpdate(order.userId, {
          $inc: { walletBalance: order.pricing.moneyPaid },
        }, { session });
        await WalletTransaction.create([{
          userId: order.userId,
          type: 'refund',
          amount: order.pricing.moneyPaid,
          balanceAfter: 0,
          description: `Refund for order ${order.orderNumber}`,
          referenceId: order._id,
          referenceType: 'Order',
        }], { session });
      }

      // Refund coins
      if (order.pricing.coinsPaid > 0) {
        const user = await User.findByIdAndUpdate(order.userId, {
          $inc: { coinBalance: order.pricing.coinsPaid },
        }, { new: true, session });
        const CoinTransaction = (await import('../wallet/coinTransaction.model.js')).default;
        await CoinTransaction.create([{
          userId: order.userId,
          type: 'refund_credit',
          amount: order.pricing.coinsPaid,
          balanceAfter: user.coinBalance,
          description: `Refund for order ${order.orderNumber}`,
          referenceId: order._id,
          referenceType: 'Order',
        }], { session });
      }

      await Order.findByIdAndUpdate(orderId, {
        status: 'refunded',
        paymentStatus: 'refunded',
        refundReason: reason,
        refundedAt: new Date(),
        downloadToken: null,
      }, { session });

      await createNotification(order.userId, {
        type: 'refund',
        title: 'Refund Processed',
        message: `Your refund for order ${order.orderNumber} has been processed.`,
        actionUrl: '/dashboard/wallet',
      });
    });
  } finally {
    await session.endSession();
  }
}
