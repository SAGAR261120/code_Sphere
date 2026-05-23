import { Router } from 'express';
import * as ctrl from './wallet.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { depositRateLimiter } from '../../middleware/rateLimit.middleware.js';
import { uploadPaymentProof } from '../../middleware/upload.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/', ctrl.getWalletData);
router.get('/transactions', ctrl.getWalletTransactions);
router.get('/coin-transactions', ctrl.getCoinTransactions);
router.post('/deposit/initiate', depositRateLimiter, ctrl.initiateDeposit);
router.post('/deposit/verify-razorpay', ctrl.verifyRazorpayDeposit);
router.post('/deposit/manual', depositRateLimiter, uploadPaymentProof, ctrl.submitManualDeposit);

export default router;
