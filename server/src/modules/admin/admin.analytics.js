import User from '../users/user.model.js';
import Product from '../products/product.model.js';
import Order from '../orders/order.model.js';
import Deposit from '../wallet/deposit.model.js';
import TaskSession from '../tasks/taskSession.model.js';
import Task from '../tasks/task.model.js';
import CoinTransaction from '../wallet/coinTransaction.model.js';

function getRangeDate(range) {
  const map = { '7d': 7, '30d': 30, '90d': 90, '1y': 365 };
  const days = map[range] || 30;
  return new Date(Date.now() - days * 86400000);
}

const startOfDay = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

export async function getOverviewStats() {
  const today = startOfDay();

  const [
    totalUsers,
    newUsersToday,
    totalOrders,
    ordersToday,
    totalCoinsAwarded,
    pendingDeposits,
    revenueData,
    revenueToday,
    topProducts,
  ] = await Promise.all([
    User.countDocuments({ role: 'user' }),
    User.countDocuments({ role: 'user', createdAt: { $gte: today } }),
    Order.countDocuments({ status: 'completed' }),
    Order.countDocuments({ status: 'completed', createdAt: { $gte: today } }),
    CoinTransaction.aggregate([
      { $match: { type: { $in: ['task_reward', 'referral_reward', 'admin_credit'] } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    Deposit.countDocuments({ status: 'pending' }),
    Order.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$pricingSnapshot.moneyCharged' } } },
    ]),
    Order.aggregate([
      { $match: { status: 'completed', createdAt: { $gte: today } } },
      { $group: { _id: null, total: { $sum: '$pricingSnapshot.moneyCharged' } } },
    ]),
    Product.find({ status: 'active' })
      .select('name totalSales totalRevenueMoney')
      .sort({ totalRevenueMoney: -1 })
      .limit(5)
      .lean(),
  ]);

  return {
    totalUsers,
    newUsersToday,
    totalOrders,
    ordersToday,
    totalCoinsAwarded: totalCoinsAwarded[0]?.total || 0,
    pendingDeposits,
    totalRevenue: revenueData[0]?.total || 0,
    revenueToday: revenueToday[0]?.total || 0,
    topProducts: topProducts.map((p) => ({ ...p, revenue: p.totalRevenueMoney || 0 })),
  };
}

export async function getRevenueChart({ period = '30d' } = {}) {
  const since = getRangeDate(period);
  const data = await Order.aggregate([
    { $match: { status: 'completed', createdAt: { $gte: since } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        revenue: { $sum: '$pricingSnapshot.moneyCharged' },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);
  return data.map((d) => ({ label: d._id, revenue: d.revenue, count: d.count }));
}

export async function getUserGrowthChart({ period = '30d' } = {}) {
  const since = getRangeDate(period);
  const data = await User.aggregate([
    { $match: { createdAt: { $gte: since }, role: 'user' } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);
  return data.map((d) => ({ label: d._id, count: d.count }));
}

export async function getTopProducts(limit = 10) {
  const products = await Product.find({ status: 'active' })
    .select('name thumbnail totalSales totalRevenueMoney')
    .sort({ totalRevenueMoney: -1 })
    .limit(limit)
    .lean();
  return products.map((p) => ({ ...p, revenue: p.totalRevenueMoney || 0 }));
}

export async function getRecentActivity(limit = 15) {
  const [orders, deposits] = await Promise.all([
    Order.find({ status: 'completed' })
      .sort({ createdAt: -1 })
      .limit(Math.ceil(limit / 2))
      .populate('userId', 'name')
      .populate('productId', 'name')
      .lean(),
    Deposit.find({ status: 'approved' })
      .sort({ createdAt: -1 })
      .limit(Math.floor(limit / 2))
      .populate('userId', 'name')
      .lean(),
  ]);

  const activities = [
    ...orders.map((o) => ({
      _id: o._id,
      description: `${o.userId?.name || 'User'} purchased ${o.productId?.name || 'a product'}`,
      createdAt: o.createdAt,
    })),
    ...deposits.map((d) => ({
      _id: d._id,
      description: `${d.userId?.name || 'User'} deposited ₹${d.amount}`,
      createdAt: d.createdAt,
    })),
  ];

  return activities.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, limit);
}
