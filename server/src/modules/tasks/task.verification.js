import { verifyTaskSessionToken } from '../../utils/tokenUtils.js';
import { generateFingerprint, getClientIp } from '../../utils/fingerprint.js';
import TaskSession from './taskSession.model.js';
import Task from './task.model.js';
import { getRedis } from '../../config/redis.js';
import { ApiError } from '../../utils/ApiError.js';

export async function verifyTaskCompletion(taskId, userId, sessionToken, verificationData = {}, req) {
  const fraudFlags = [];

  // Step 1: Validate JWT session token
  let decoded;
  try {
    decoded = verifyTaskSessionToken(sessionToken);
  } catch (err) {
    throw new ApiError(401, 'Invalid or expired session token');
  }

  if (decoded.taskId !== taskId.toString() || decoded.userId !== userId.toString()) {
    throw new ApiError(401, 'Session token does not match this task or user');
  }

  // Step 2: Get cached session from Redis
  const redis = getRedis();
  const cachedRaw = await redis.get(`task_session:${sessionToken}`);
  if (!cachedRaw) throw new ApiError(400, 'Session expired. Please start the task again.');
  const sessionCache = JSON.parse(cachedRaw);

  const timeSpentSeconds = (Date.now() - sessionCache.startedAt) / 1000;

  // Step 3: Get task config
  const task = await Task.findById(taskId);
  if (!task) throw new ApiError(404, 'Task not found');

  // Step 4: Time check
  if (timeSpentSeconds < task.requiredDuration) {
    await markSessionFraud(sessionToken, ['INSUFFICIENT_TIME'], timeSpentSeconds);
    throw new ApiError(400, `Minimum time not met. Required: ${task.requiredDuration}s, Spent: ${Math.floor(timeSpentSeconds)}s`);
  }

  // Step 5: IP consistency
  const clientIp = getClientIp(req);
  const session = await TaskSession.findOne({ sessionToken });
  if (!session) throw new ApiError(404, 'Session record not found');

  if (session.ipAddress !== clientIp) {
    fraudFlags.push('IP_MISMATCH');
  }

  // Step 6: Device fingerprint consistency
  const currentFingerprint = generateFingerprint(req);
  if (session.deviceFingerprint !== currentFingerprint) {
    fraudFlags.push('DEVICE_MISMATCH');
  }

  // Step 7: Multi-account from same IP detection
  const oneDayAgo = new Date(Date.now() - 86400000);
  const ipCompletionsToday = await TaskSession.countDocuments({
    taskId,
    ipAddress: clientIp,
    status: 'completed',
    completedAt: { $gte: oneDayAgo },
    userId: { $ne: userId },
  });
  if (ipCompletionsToday >= 3) {
    fraudFlags.push('IP_MULTI_ACCOUNT');
  }

  // Step 8: Provider callback verification (for callback method)
  if (task.verificationMethod === 'callback' && verificationData.callbackCode) {
    const isValid = await verifyProviderCallback(task.linkProvider, verificationData.callbackCode);
    if (!isValid) {
      await markSessionFraud(sessionToken, ['INVALID_PROVIDER_CALLBACK'], timeSpentSeconds);
      throw new ApiError(400, 'Link provider verification failed. Please complete the link properly.');
    }
  }

  // Step 9: Hard fraud block (IP_MULTI_ACCOUNT alone is soft flag — log but allow)
  const hardFraudFlags = fraudFlags.filter((f) =>
    ['INSUFFICIENT_TIME', 'INVALID_PROVIDER_CALLBACK'].includes(f)
  );
  if (hardFraudFlags.length > 0) {
    await markSessionFraud(sessionToken, fraudFlags, timeSpentSeconds);
    throw new ApiError(403, 'Verification failed due to suspicious activity');
  }

  // Step 10: Clean Redis session
  await redis.del(`task_session:${sessionToken}`);

  return { timeSpentSeconds, fraudFlags };
}

async function markSessionFraud(sessionToken, fraudFlags, timeSpent) {
  await TaskSession.findOneAndUpdate(
    { sessionToken },
    { status: 'fraud', fraudFlags, timeSpentSeconds: timeSpent }
  );
}

async function verifyProviderCallback(provider, code) {
  // In production, call the provider's API to verify the code
  // Each shortener has a different callback/verification API
  if (provider === 'custom') return true;
  if (!code || code.length < 5) return false;
  return true; // extend per-provider
}
