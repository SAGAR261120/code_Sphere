import Task from './task.model.js';
import TaskSession from './taskSession.model.js';
import { verifyTaskCompletion } from './task.verification.js';
import { awardCoins } from '../../utils/coinUtils.js';
import { generateTaskSessionToken } from '../../utils/tokenUtils.js';
import { generateFingerprint, getClientIp } from '../../utils/fingerprint.js';
import { getRedis } from '../../config/redis.js';
import { ApiError } from '../../utils/ApiError.js';
import { sendEmail } from '../../config/email.js';
import { taskRewardTemplate } from '../../utils/emailTemplates.js';

export async function listTasks(userId) {
  const tasks = await Task.find({
    status: 'active',
    $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
  }).sort({ createdAt: -1 });

  // Attach completion status per user
  const sessions = await TaskSession.find({
    userId,
    status: 'completed',
    taskId: { $in: tasks.map((t) => t._id) },
  }).select('taskId');

  const completedIds = new Set(sessions.map((s) => s.taskId.toString()));
  return tasks.map((t) => ({
    ...t.toObject(),
    isCompleted: completedIds.has(t._id.toString()),
  }));
}

export async function getTask(taskId) {
  const task = await Task.findById(taskId);
  if (!task) throw new ApiError(404, 'Task not found');
  return task;
}

export async function startTask(taskId, userId, req) {
  const task = await Task.findById(taskId);
  if (!task || task.status !== 'active') throw new ApiError(404, 'Task not available');
  if (task.expiresAt && task.expiresAt < new Date()) throw new ApiError(400, 'Task has expired');
  if (task.totalCompletionLimit && task.totalCompletions >= task.totalCompletionLimit) {
    throw new ApiError(409, 'Task completion limit reached');
  }

  // Check max completions per user
  const userCompletions = await TaskSession.countDocuments({ taskId, userId, status: 'completed' });
  if (userCompletions >= task.maxCompletionsPerUser) {
    throw new ApiError(409, 'You have already completed this task the maximum number of times');
  }

  // Cooldown check
  const lastCompleted = await TaskSession.findOne({ taskId, userId, status: 'completed' }).sort({ completedAt: -1 });
  if (lastCompleted) {
    const cooldownEnd = new Date(lastCompleted.completedAt.getTime() + task.cooldownHours * 3600000);
    if (cooldownEnd > new Date()) {
      throw new ApiError(429, `Cooldown active. Try again after ${cooldownEnd.toISOString()}`);
    }
  }

  // IP rate limiting
  const clientIp = getClientIp(req);
  const redis = getRedis();
  const ipKey = `task_ip:${clientIp}:${taskId}`;
  const ipAttempts = await redis.incr(ipKey);
  if (ipAttempts === 1) await redis.expire(ipKey, 3600);
  if (ipAttempts > 10) throw new ApiError(429, 'Too many attempts from your network');

  // Return existing pending session if any
  const existingSession = await TaskSession.findOne({ taskId, userId, status: 'pending' });
  if (existingSession) {
    return { sessionToken: existingSession.sessionToken, redirectUrl: task.shortenedUrl };
  }

  const sessionToken = generateTaskSessionToken(taskId, userId);
  const fingerprint = generateFingerprint(req);

  await TaskSession.create({
    taskId,
    userId,
    sessionToken,
    ipAddress: clientIp,
    userAgent: req.headers['user-agent'],
    deviceFingerprint: fingerprint,
  });

  // Cache session start time in Redis
  await redis.setex(
    `task_session:${sessionToken}`,
    task.requiredDuration * 4 + 300,
    JSON.stringify({ taskId: taskId.toString(), userId: userId.toString(), startedAt: Date.now() })
  );

  return { sessionToken, redirectUrl: task.shortenedUrl, requiredDuration: task.requiredDuration };
}

export async function verifyTask(taskId, userId, sessionToken, verificationData, req) {
  const { timeSpentSeconds, fraudFlags } = await verifyTaskCompletion(
    taskId, userId, sessionToken, verificationData, req
  );

  const task = await Task.findById(taskId);

  // Award coins atomically
  const session = await TaskSession.findOne({ sessionToken });
  await awardCoins(userId, task.rewardCoins, session._id, 'TaskSession', `Task reward: ${task.title}`);

  // Update session
  await TaskSession.findByIdAndUpdate(session._id, {
    status: 'completed',
    completedAt: new Date(),
    timeSpentSeconds,
    coinsAwarded: task.rewardCoins,
    fraudFlags,
  });

  // Increment task total completions
  await Task.findByIdAndUpdate(taskId, { $inc: { totalCompletions: 1 } });

  // Send reward email (non-blocking)
  const User = (await import('../users/user.model.js')).default;
  const user = await User.findById(userId).select('email name notificationPrefs');
  if (user?.notificationPrefs?.email) {
    sendEmail({
      to: user.email,
      subject: `You earned ${task.rewardCoins} coins!`,
      html: taskRewardTemplate(user.name, task.rewardCoins, task.title),
    }).catch(() => {});
  }

  return { coinsAwarded: task.rewardCoins, message: 'Task completed! Coins have been added to your account.' };
}

export async function getUserTaskHistory(userId, page = 1) {
  const limit = 20;
  const skip = (page - 1) * limit;
  const [sessions, total] = await Promise.all([
    TaskSession.find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('taskId', 'title rewardCoins taskType')
      .lean(),
    TaskSession.countDocuments({ userId }),
  ]);
  return { sessions, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
}

// Admin
export async function createTask(data, adminId) {
  return Task.create({ ...data, createdBy: adminId });
}

export async function updateTask(id, data) {
  const task = await Task.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  if (!task) throw new ApiError(404, 'Task not found');
  return task;
}

export async function deleteTask(id) {
  const task = await Task.findByIdAndDelete(id);
  if (!task) throw new ApiError(404, 'Task not found');
}

export async function adminListSessions(page = 1, status) {
  const limit = 50;
  const skip = (page - 1) * limit;
  const filter = status ? { status } : {};
  const [sessions, total] = await Promise.all([
    TaskSession.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('taskId', 'title')
      .populate('userId', 'name email')
      .lean(),
    TaskSession.countDocuments(filter),
  ]);
  return { sessions, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
}
