import { Router } from 'express';
import * as ctrl from './user.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/profile', ctrl.getProfile);
router.patch('/profile', ctrl.updateProfile);
router.patch('/change-password', ctrl.changePassword);
router.get('/dashboard-summary', ctrl.getDashboardSummary);
router.get('/referrals', ctrl.getReferralStats);
router.get('/notifications', ctrl.getNotifications);
router.get('/notifications/unread-count', ctrl.getUnreadCount);
router.patch('/notifications/:id/read', ctrl.markNotificationRead);
router.patch('/notifications/read-all', ctrl.markAllNotificationsRead);

export default router;
