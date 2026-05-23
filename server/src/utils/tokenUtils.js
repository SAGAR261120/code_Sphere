import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { ACCESS_TOKEN_EXPIRY, REFRESH_TOKEN_EXPIRY } from '../config/constants.js';

export function generateTokens(userId, role) {
  const accessToken = jwt.sign(
    { userId: userId.toString(), role },
    process.env.ACCESS_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );
  const refreshToken = jwt.sign(
    { userId: userId.toString() },
    process.env.REFRESH_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRY }
  );
  return { accessToken, refreshToken };
}

export function verifyAccessToken(token) {
  return jwt.verify(token, process.env.ACCESS_SECRET);
}

export function verifyRefreshToken(token) {
  return jwt.verify(token, process.env.REFRESH_SECRET);
}

export function generateEmailToken() {
  return crypto.randomBytes(32).toString('hex');
}

export function generateDownloadToken(orderId, userId, productId) {
  return jwt.sign(
    {
      orderId: orderId.toString(),
      userId: userId.toString(),
      productId: productId.toString(),
    },
    process.env.DOWNLOAD_SECRET,
    { expiresIn: '24h' }
  );
}

export function verifyDownloadToken(token) {
  return jwt.verify(token, process.env.DOWNLOAD_SECRET);
}

export function generateTaskSessionToken(taskId, userId) {
  return jwt.sign(
    { taskId: taskId.toString(), userId: userId.toString(), startedAt: Date.now() },
    process.env.TASK_SECRET,
    { expiresIn: '2h' }
  );
}

export function verifyTaskSessionToken(token) {
  return jwt.verify(token, process.env.TASK_SECRET);
}
