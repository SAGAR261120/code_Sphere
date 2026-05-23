import { Router } from 'express';
import * as ctrl from './payment.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import express from 'express';

const router = Router();

router.post('/razorpay/create-order', authenticate, ctrl.razorpayCreateOrder);
router.post('/razorpay/verify', authenticate, ctrl.razorpayVerify);
router.post('/stripe/create-intent', authenticate, ctrl.stripeCreateIntent);
// Stripe webhooks need raw body
router.post('/stripe/webhook', express.raw({ type: 'application/json' }), ctrl.stripeWebhook);

export default router;
