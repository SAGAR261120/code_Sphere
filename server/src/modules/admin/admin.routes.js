import { Router } from 'express';
import * as ctrl from './admin.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { isAdmin } from '../../middleware/rbac.middleware.js';

const router = Router();

router.use(authenticate, isAdmin);

// Analytics
router.get('/analytics/overview', ctrl.getOverviewStats);
router.get('/analytics/revenue', ctrl.getRevenueChart);
router.get('/analytics/user-growth', ctrl.getUserGrowthChart);
router.get('/analytics/top-products', ctrl.getTopProducts);
router.get('/analytics/recent-activity', ctrl.getRecentActivity);

// Users
router.get('/users', ctrl.listUsers);
router.get('/users/:id', ctrl.getUserDetails);
router.patch('/users/:id/status', ctrl.updateUserStatus);
router.post('/users/:id/coins', ctrl.adjustUserCoins);
router.post('/users/:id/wallet', ctrl.adjustUserWallet);

// Products (read-only listing; writes go through /products routes with admin auth)
router.get('/products', ctrl.adminListProducts);
router.get('/products/:id', ctrl.adminGetProduct);

// Tasks (read-only listing; writes go through /tasks routes with admin auth)
router.get('/tasks', ctrl.adminListTasks);

// Deposits
router.get('/deposits', ctrl.getDeposits);
router.patch('/deposits/:id/approve', ctrl.approveDeposit);
router.patch('/deposits/:id/reject', ctrl.rejectDeposit);

// Orders
router.get('/orders', ctrl.getAllOrders);
router.post('/orders/:id/refund', ctrl.adminRefundOrder);

// Fraud
router.get('/reports/fraud', ctrl.getFraudReports);

// Coupons
router.post('/coupons', ctrl.createCoupon);
router.get('/coupons', ctrl.listCoupons);
router.delete('/coupons/:id', ctrl.deleteCoupon);
router.patch('/coupons/:id/toggle', ctrl.toggleCoupon);

export default router;
