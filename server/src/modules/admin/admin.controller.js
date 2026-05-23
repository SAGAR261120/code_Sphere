import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { ApiError } from '../../utils/ApiError.js';
import * as analytics from './admin.analytics.js';
import User from '../users/user.model.js';
import Product from '../products/product.model.js';
import Task from '../tasks/task.model.js';
import TaskSession from '../tasks/taskSession.model.js';
import Coupon from '../payments/coupon.model.js';
import { adminAdjustCoins } from '../../utils/coinUtils.js';
import { adminApproveDeposit, adminRejectDeposit, adminGetDeposits } from '../wallet/wallet.service.js';
import { adminGetAllOrders, processRefund } from '../orders/order.service.js';
import WalletTransaction from '../wallet/walletTransaction.model.js';
import mongoose from 'mongoose';
import { createNotification } from '../notifications/notification.service.js';

function paginate(total, page, limit) {
  return { total, page, limit, totalPages: Math.ceil(total / limit) };
}

// ─── Analytics ───────────────────────────────────────────────────────────────

export const getOverviewStats = asyncHandler(async (req, res) => {
  const data = await analytics.getOverviewStats();
  res.json(new ApiResponse(200, data));
});

export const getRevenueChart = asyncHandler(async (req, res) => {
  const data = await analytics.getRevenueChart({ period: req.query.period });
  res.json(new ApiResponse(200, data));
});

export const getUserGrowthChart = asyncHandler(async (req, res) => {
  const data = await analytics.getUserGrowthChart({ period: req.query.period });
  res.json(new ApiResponse(200, data));
});

export const getTopProducts = asyncHandler(async (req, res) => {
  const data = await analytics.getTopProducts(parseInt(req.query.limit) || 10);
  res.json(new ApiResponse(200, data));
});

export const getRecentActivity = asyncHandler(async (req, res) => {
  const data = await analytics.getRecentActivity();
  res.json(new ApiResponse(200, data));
});

// ─── Users ────────────────────────────────────────────────────────────────────

export const listUsers = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.role) filter.role = req.query.role;
  if (req.query.search) {
    filter.$or = [
      { name: { $regex: req.query.search, $options: 'i' } },
      { email: { $regex: req.query.search, $options: 'i' } },
    ];
  }

  const [users, total] = await Promise.all([
    User.find(filter).select('-password -refreshToken -emailVerificationToken -passwordResetToken').sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    User.countDocuments(filter),
  ]);

  res.json(new ApiResponse(200, { users, ...paginate(total, page, limit) }));
});

export const getUserDetails = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-password -refreshToken');
  if (!user) throw new ApiError(404, 'User not found');
  res.json(new ApiResponse(200, user));
});

export const updateUserStatus = asyncHandler(async (req, res) => {
  const { status, reason } = req.body;
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { status, banReason: reason || null },
    { new: true }
  );
  if (!user) throw new ApiError(404, 'User not found');
  await createNotification(user._id, {
    type: 'system',
    title: `Account ${status}`,
    message: reason ? `Reason: ${reason}` : `Your account status has been updated to: ${status}`,
  });
  res.json(new ApiResponse(200, user, `User ${status}`));
});

export const adjustUserCoins = asyncHandler(async (req, res) => {
  const { amount, reason } = req.body;
  if (!amount || amount === 0) throw new ApiError(400, 'Amount must be non-zero');
  await adminAdjustCoins(req.params.id, amount, req.user._id, reason);
  res.json(new ApiResponse(200, null, `Coins adjusted by ${amount}`));
});

export const adjustUserWallet = asyncHandler(async (req, res) => {
  const { amount, reason } = req.body;
  if (!amount || amount === 0) throw new ApiError(400, 'Amount must be non-zero');

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const user = await User.findByIdAndUpdate(
        req.params.id,
        { $inc: { walletBalance: amount } },
        { new: true, session }
      );
      if (!user) throw new ApiError(404, 'User not found');
      if (user.walletBalance < 0) throw new ApiError(400, 'Wallet balance cannot go negative');
      await WalletTransaction.create([{
        userId: req.params.id,
        type: amount > 0 ? 'admin_credit' : 'admin_debit',
        amount: Math.abs(amount),
        balanceAfter: user.walletBalance,
        description: reason || 'Admin adjustment',
        referenceId: req.user._id,
        referenceType: 'User',
      }], { session });
    });
  } finally {
    await session.endSession();
  }
  res.json(new ApiResponse(200, null, `Wallet adjusted by ${amount}`));
});

// ─── Products ─────────────────────────────────────────────────────────────────

export const adminListProducts = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 15;
  const skip = (page - 1) * limit;

  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.search) filter.$text = { $search: req.query.search };

  const [products, total] = await Promise.all([
    Product.find(filter).populate('category', 'name').sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Product.countDocuments(filter),
  ]);

  res.json(new ApiResponse(200, { products, ...paginate(total, page, limit) }));
});

export const adminGetProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id).populate('category', 'name');
  if (!product) throw new ApiError(404, 'Product not found');
  res.json(new ApiResponse(200, product));
});

// ─── Tasks ────────────────────────────────────────────────────────────────────

export const adminListTasks = asyncHandler(async (req, res) => {
  const tasks = await Task.find().sort({ createdAt: -1 }).lean();
  res.json(new ApiResponse(200, { tasks }));
});

// ─── Deposits ─────────────────────────────────────────────────────────────────

export const getDeposits = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const data = await adminGetDeposits(page, req.query.status);
  res.json(new ApiResponse(200, data));
});

export const approveDeposit = asyncHandler(async (req, res) => {
  await adminApproveDeposit(req.params.id, req.user._id, req.body.note);
  res.json(new ApiResponse(200, null, 'Deposit approved and wallet credited'));
});

export const rejectDeposit = asyncHandler(async (req, res) => {
  await adminRejectDeposit(req.params.id, req.user._id, req.body.reason);
  res.json(new ApiResponse(200, null, 'Deposit rejected'));
});

// ─── Orders ───────────────────────────────────────────────────────────────────

export const getAllOrders = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const data = await adminGetAllOrders(page, req.query.status, req.query.search);
  res.json(new ApiResponse(200, data));
});

export const adminRefundOrder = asyncHandler(async (req, res) => {
  await processRefund(req.params.id, req.body.reason, req.user._id);
  res.json(new ApiResponse(200, null, 'Refund processed'));
});

// ─── Fraud ────────────────────────────────────────────────────────────────────

export const getFraudReports = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 50;
  const skip = (page - 1) * limit;
  const [sessions, total] = await Promise.all([
    TaskSession.find({ status: 'fraud' })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('userId', 'name email')
      .populate('taskId', 'title')
      .lean(),
    TaskSession.countDocuments({ status: 'fraud' }),
  ]);
  res.json(new ApiResponse(200, { sessions, ...paginate(total, page, limit) }));
});

// ─── Coupons ──────────────────────────────────────────────────────────────────

export const createCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.create({ ...req.body, createdBy: req.user._id });
  res.status(201).json(new ApiResponse(201, coupon, 'Coupon created'));
});

export const listCoupons = asyncHandler(async (req, res) => {
  const coupons = await Coupon.find().sort({ createdAt: -1 }).populate('createdBy', 'name');
  res.json(new ApiResponse(200, { coupons }));
});

export const deleteCoupon = asyncHandler(async (req, res) => {
  await Coupon.findByIdAndDelete(req.params.id);
  res.json(new ApiResponse(200, null, 'Coupon deleted'));
});

export const toggleCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findById(req.params.id);
  if (!coupon) throw new ApiError(404, 'Coupon not found');
  coupon.isActive = !coupon.isActive;
  await coupon.save();
  res.json(new ApiResponse(200, coupon, `Coupon ${coupon.isActive ? 'activated' : 'deactivated'}`));
});
