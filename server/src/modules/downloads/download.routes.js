import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { serveDownload } from './download.service.js';
import { downloadRateLimiter } from '../../middleware/rateLimit.middleware.js';

const router = Router();

router.get('/:downloadToken', downloadRateLimiter, asyncHandler(async (req, res) => {
  await serveDownload(req.params.downloadToken, res);
}));

export default router;
