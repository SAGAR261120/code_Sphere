import mongoose from 'mongoose';
import crypto from 'crypto';
import Razorpay from 'razorpay';
import User from '../users/user.model.js';
import Deposit from './deposit.model.js';
import WalletTransaction from './walletTransaction.model.js';
import CoinTransaction from './coinTransaction.model.js';
import { createNotification } from '../notifications/notification.service.js';
import { ApiError } from '../../utils/ApiError.js';

let razorpay;
function getRazorpay() {
  if (!razorpay) {
    razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
  return razorpay;
}

export async function getWalletData(userId) {
  const user = await User.findById(userId).select('walletBalance coinBalance totalEarnedCoins totalSpentCoins');
  const [walletTxCount, coinTxCount] = await Promise.all([
    WalletTransaction.countDocuments({ userId }),
    CoinTransaction.countDocuments({ userId }),
  ]);
  return { wallet: user, walletTxCount, coinTxCount };
}

export async function getWalletTransactions(userId, page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  const [transactions, total] = await Promise.all([
    WalletTransaction.find({ userId }).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    WalletTransaction.countDocuments({ userId }),
  ]);
  return { transactions, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
}

export async function getCoinTransactions(userId, page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  const [transactions, total] = await Promise.all([
    CoinTransaction.find({ userId }).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    CoinTransaction.countDocuments({ userId }),
  ]);
  return { transactions, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
}

export async function initiateDeposit(userId, amount, method) {
  if (amount < 100) throw new ApiError(400, 'Minimum deposit is ₹1 (100 paise)');

  const deposit = await Deposit.create({ userId, amount, method, status: 'pending' });

  if (method === 'razorpay') {
    const rpay = getRazorpay();
    const rzpOrder = await rpay.orders.create({
      amount,
      currency: 'INR',
      receipt: deposit._id.toString(),
      notes: { depositId: deposit._id.toString(), userId: userId.toString() },
    });
    await Deposit.findByIdAndUpdate(deposit._id, { gatewayOrderId: rzpOrder.id });
    return {
      depositId: deposit._id,
      gatewayOrderId: rzpOrder.id,
      amount,
      currency: 'INR',
      key: process.env.RAZORPAY_KEY_ID,
    };
  }

  return { depositId: deposit._id };
}

export async function verifyRazorpayDeposit(userId, { depositId, gatewayOrderId, gatewayPaymentId, gatewaySignature }) {
  const deposit = await Deposit.findOne({ _id: depositId, userId, status: 'pending' });
  if (!deposit) throw new ApiError(404, 'Deposit not found or already processed');

  // Verify HMAC signature
  const body = `${gatewayOrderId}|${gatewayPaymentId}`;
  const expectedSig = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest('hex');

  if (expectedSig !== gatewaySignature) {
    await Deposit.findByIdAndUpdate(depositId, { status: 'failed' });
    throw new ApiError(400, 'Payment signature verification failed');
  }

  await creditWallet(userId, deposit.amount, depositId, 'razorpay', gatewayPaymentId);
}

export async function submitManualDeposit(userId, amount, proofImageUrl) {
  if (!proofImageUrl) throw new ApiError(400, 'Payment proof required for manual deposits');
  const deposit = await Deposit.create({
    userId,
    amount,
    method: 'manual',
    status: 'pending',
    proofImageUrl,
  });
  return { depositId: deposit._id, message: 'Manual deposit submitted. Awaiting admin approval.' };
}

export async function adminApproveDeposit(depositId, adminId, note) {
  const deposit = await Deposit.findById(depositId);
  if (!deposit) throw new ApiError(404, 'Deposit not found');
  if (deposit.status !== 'pending') throw new ApiError(409, 'Deposit already processed');

  await creditWallet(deposit.userId, deposit.amount, depositId, deposit.method, null);
  await Deposit.findByIdAndUpdate(depositId, {
    status: 'approved',
    approvedBy: adminId,
    adminNote: note,
    processedAt: new Date(),
  });
}

export async function adminRejectDeposit(depositId, adminId, note) {
  const deposit = await Deposit.findById(depositId);
  if (!deposit) throw new ApiError(404, 'Deposit not found');
  if (deposit.status !== 'pending') throw new ApiError(409, 'Deposit already processed');

  await Deposit.findByIdAndUpdate(depositId, {
    status: 'rejected',
    approvedBy: adminId,
    adminNote: note,
    processedAt: new Date(),
  });

  await createNotification(deposit.userId, {
    type: 'deposit',
    title: 'Deposit Rejected',
    message: `Your deposit of ₹${deposit.amount / 100} was rejected. Reason: ${note || 'Contact support'}`,
    actionUrl: '/dashboard/wallet',
  });
}

export async function adminGetDeposits(page = 1, status) {
  const limit = 50;
  const skip = (page - 1) * limit;
  const filter = status ? { status } : {};
  const [deposits, total] = await Promise.all([
    Deposit.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('userId', 'name email')
      .populate('approvedBy', 'name'),
    Deposit.countDocuments(filter),
  ]);
  return { deposits, total, totalPages: Math.ceil(total / limit) };
}

async function creditWallet(userId, amount, depositId, gateway, gatewayPaymentId) {
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const user = await User.findByIdAndUpdate(
        userId,
        { $inc: { walletBalance: amount } },
        { new: true, session }
      );
      await WalletTransaction.create([{
        userId,
        type: 'deposit',
        amount,
        balanceAfter: user.walletBalance,
        description: `Wallet recharge via ${gateway}`,
        referenceId: depositId,
        referenceType: 'Deposit',
        paymentGateway: gateway,
        gatewayTransactionId: gatewayPaymentId,
      }], { session });

      await Deposit.findByIdAndUpdate(depositId, {
        status: 'approved',
        gatewayPaymentId,
        processedAt: new Date(),
      }, { session });

      await createNotification(userId, {
        type: 'deposit',
        title: 'Deposit Successful!',
        message: `₹${amount / 100} has been added to your wallet.`,
        actionUrl: '/dashboard/wallet',
      });
    });
  } finally {
    await session.endSession();
  }
}
