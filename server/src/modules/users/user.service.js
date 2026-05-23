import User from './user.model.js';
import Order from '../orders/order.model.js';
import TaskSession from '../tasks/taskSession.model.js';
import { ApiError } from '../../utils/ApiError.js';

export async function getProfile(userId) {
  const user = await User.findById(userId).populate('referredBy', 'name email');
  if (!user) throw new ApiError(404, 'User not found');
  return user;
}

export async function updateProfile(userId, updates) {
  const allowed = ['name', 'avatar', 'theme', 'notificationPrefs'];
  const filtered = Object.fromEntries(
    Object.entries(updates).filter(([k]) => allowed.includes(k))
  );
  const user = await User.findByIdAndUpdate(userId, filtered, { new: true, runValidators: true });
  if (!user) throw new ApiError(404, 'User not found');
  return user;
}

export async function changePassword(userId, currentPassword, newPassword) {
  const user = await User.findById(userId).select('+password');
  if (!user) throw new ApiError(404, 'User not found');

  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) throw new ApiError(401, 'Current password is incorrect');

  user.password = newPassword;
  await user.save();
  return { message: 'Password changed successfully' };
}

export async function getDashboardSummary(userId) {
  const [user, recentOrders, completedTasks] = await Promise.all([
    User.findById(userId).select('walletBalance coinBalance totalEarnedCoins totalSpentCoins'),
    Order.find({ userId, status: 'completed' })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('productId', 'name thumbnail slug'),
    TaskSession.countDocuments({ userId, status: 'completed' }),
  ]);

  return {
    wallet: {
      balance: user.walletBalance,
      coins: user.coinBalance,
      totalEarned: user.totalEarnedCoins,
      totalSpent: user.totalSpentCoins,
    },
    recentOrders,
    stats: {
      totalPurchases: await Order.countDocuments({ userId, status: 'completed' }),
      tasksCompleted: completedTasks,
    },
  };
}

export async function getReferralStats(userId) {
  const user = await User.findById(userId).select('referralCode referralEarnings');
  const referredUsers = await User.find({ referredBy: userId })
    .select('name email createdAt')
    .sort({ createdAt: -1 })
    .limit(50);

  return {
    referralCode: user.referralCode,
    referralLink: `${process.env.CLIENT_URL}/register?ref=${user.referralCode}`,
    totalReferred: referredUsers.length,
    referralEarnings: user.referralEarnings,
    referredUsers,
  };
}
