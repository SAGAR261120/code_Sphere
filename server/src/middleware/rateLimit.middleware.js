import rateLimit from 'express-rate-limit';

const isDev = process.env.NODE_ENV !== 'production';

const createLimiter = (windowMs, max, message, skipInDev = false) =>
  rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message },
    skip: (req) => (skipInDev && isDev) || req.user?.role === 'super_admin',
  });

export const globalRateLimiter = createLimiter(15 * 60 * 1000, 300, 'Too many requests, please slow down.');
export const authRateLimiter = createLimiter(15 * 60 * 1000, 10, 'Too many auth attempts. Try again in 15 minutes.', true);
export const taskRateLimiter = createLimiter(60 * 1000, 5, 'Too many task attempts. Wait a moment.');
export const downloadRateLimiter = createLimiter(60 * 60 * 1000, 20, 'Download rate limit reached.');
export const depositRateLimiter = createLimiter(60 * 60 * 1000, 5, 'Too many deposit requests.');
