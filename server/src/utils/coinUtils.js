import mongoose from 'mongoose';
import User from '../modules/users/user.model.js';
import CoinTransaction from '../modules/wallet/coinTransaction.model.js';
import { createNotification } from '../modules/notifications/notification.service.js';

export async function awardCoins(userId, amount, referenceId, referenceType, description) {
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const user = await User.findByIdAndUpdate(
        userId,
        { $inc: { coinBalance: amount, totalEarnedCoins: amount } },
        { new: true, session }
      );

      await CoinTransaction.create([{
        userId,
        type: 'task_reward',
        amount,
        balanceAfter: user.coinBalance,
        description: description || 'Task completion reward',
        referenceId,
        referenceType,
      }], { session });

      await createNotification(userId, {
        type: 'task_reward',
        title: 'Coins Earned!',
        message: `You earned ${amount} coins.`,
        actionUrl: '/dashboard/tasks',
      });
    });
  } finally {
    await session.endSession();
  }
}

export async function spendCoins(userId, amount, referenceId, referenceType, description, session) {
  const user = await User.findByIdAndUpdate(
    userId,
    { $inc: { coinBalance: -amount, totalSpentCoins: amount } },
    { new: true, session }
  );

  if (user.coinBalance < 0) {
    throw new Error('Insufficient coin balance');
  }

  await CoinTransaction.create([{
    userId,
    type: 'purchase_spend',
    amount: -amount,
    balanceAfter: user.coinBalance,
    description: description || 'Purchase',
    referenceId,
    referenceType,
  }], { session });

  return user;
}

export async function adminAdjustCoins(userId, amount, adminId, reason) {
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const user = await User.findByIdAndUpdate(
        userId,
        { $inc: { coinBalance: amount } },
        { new: true, session }
      );

      if (user.coinBalance < 0) throw new Error('Coin balance cannot go negative');

      await CoinTransaction.create([{
        userId,
        type: amount > 0 ? 'admin_credit' : 'admin_debit',
        amount,
        balanceAfter: user.coinBalance,
        description: reason || 'Admin adjustment',
        referenceId: adminId,
        referenceType: 'User',
      }], { session });
    });
  } finally {
    await session.endSession();
  }
}

export function calculatePricing(product, paymentMethod, mixedOptionIndex) {
  const p = product.pricing;

  if (p.isFree) {
    return { moneyPaid: 0, coinsPaid: 0, originalMoneyPrice: 0, originalCoinPrice: 0 };
  }

  if (paymentMethod === 'coins') {
    return {
      moneyPaid: 0,
      coinsPaid: p.coinPrice,
      originalMoneyPrice: p.moneyPrice,
      originalCoinPrice: p.coinPrice,
    };
  }

  if (paymentMethod === 'mixed' && p.hasMixedPricing && p.mixedOptions.length) {
    const idx = mixedOptionIndex || 0;
    const option = p.mixedOptions[idx];
    return {
      moneyPaid: option.moneyAmount,
      coinsPaid: option.coinAmount,
      originalMoneyPrice: p.moneyPrice,
      originalCoinPrice: p.coinPrice,
    };
  }

  return {
    moneyPaid: p.discountedMoneyPrice || p.moneyPrice,
    coinsPaid: 0,
    originalMoneyPrice: p.moneyPrice,
    originalCoinPrice: p.coinPrice,
  };
}
