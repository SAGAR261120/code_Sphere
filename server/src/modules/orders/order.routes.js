import { Router } from 'express';
import * as ctrl from './order.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { isAdmin } from '../../middleware/rbac.middleware.js';

const router = Router();

router.use(authenticate);

router.post('/', ctrl.createOrder);
router.get('/my', ctrl.getMyOrders);
router.get('/my/:id', ctrl.getOrderById);
router.get('/my/:id/download-token', ctrl.getDownloadToken);

// Admin
router.get('/', isAdmin, ctrl.adminGetAllOrders);
router.post('/:id/refund', isAdmin, ctrl.processRefund);

export default router;
