import crypto from 'crypto';
import User from '../users/user.model.js';
import { generateTokens, generateEmailToken, verifyRefreshToken } from '../../utils/tokenUtils.js';
import { ApiError } from '../../utils/ApiError.js';
import { sendEmail } from '../../config/email.js';
import { emailVerificationTemplate, passwordResetTemplate } from '../../utils/emailTemplates.js';
import { getRedis } from '../../config/redis.js';
import {
  EMAIL_VERIFY_EXPIRY_HOURS,
  PASSWORD_RESET_EXPIRY_HOURS,
  REFERRAL_COIN_REWARD,
} from '../../config/constants.js';
import { createNotification } from '../notifications/notification.service.js';
import CoinTransaction from '../wallet/coinTransaction.model.js';

export async function register({ name, email, password, referralCode }) {
  const existing = await User.findOne({ email });
  if (existing) throw new ApiError(409, 'Email already registered');

  let referredBy = null;
  if (referralCode) {
    const referrer = await User.findOne({ referralCode });
    if (referrer) referredBy = referrer._id;
  }

  const verifyToken = generateEmailToken();
  const user = await User.create({
    name,
    email,
    password,
    referredBy,
    emailVerifyToken: crypto.createHash('sha256').update(verifyToken).digest('hex'),
    emailVerifyExpiry: new Date(Date.now() + EMAIL_VERIFY_EXPIRY_HOURS * 3600 * 1000),
  });

  const verifyUrl = `${process.env.CLIENT_URL}/verify-email/${verifyToken}`;
  await sendEmail({
    to: email,
    subject: 'Verify your CodeMarket account',
    html: emailVerificationTemplate(name, verifyUrl),
  });

  if (referredBy) {
    await User.findByIdAndUpdate(referredBy, {
      $inc: { coinBalance: REFERRAL_COIN_REWARD, totalEarnedCoins: REFERRAL_COIN_REWARD },
    });
    await CoinTransaction.create({
      userId: referredBy,
      type: 'referral_bonus',
      amount: REFERRAL_COIN_REWARD,
      balanceAfter: 0,
      description: `Referral bonus for inviting ${email}`,
      referenceId: user._id,
      referenceType: 'User',
    });
    await createNotification(referredBy, {
      type: 'referral',
      title: 'Referral Reward!',
      message: `You earned ${REFERRAL_COIN_REWARD} coins for referring ${name}.`,
      actionUrl: '/dashboard/referrals',
    });
  }

  return { message: 'Registration successful. Please verify your email.' };
}

export async function login({ email, password, ip }) {
  const user = await User.findOne({ email }).select('+password');
  if (!user) throw new ApiError(401, 'Invalid email or password');

  if (user.isLocked()) {
    throw new ApiError(423, `Account locked. Try again after ${user.lockUntil.toISOString()}`);
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    await user.incrementLoginAttempts();
    throw new ApiError(401, 'Invalid email or password');
  }

  if (user.status === 'banned') throw new ApiError(403, 'Account permanently banned');
  if (user.status === 'suspended') throw new ApiError(403, 'Account suspended');

  await User.findByIdAndUpdate(user._id, {
    loginAttempts: 0,
    lockUntil: null,
    lastLoginAt: new Date(),
    lastLoginIp: ip,
  });

  const { accessToken, refreshToken } = generateTokens(user._id, user.role);

  const redis = getRedis();
  await redis.setex(`refresh:${user._id}`, 7 * 86400, refreshToken);

  const safeUser = user.toObject();
  delete safeUser.password;

  return { accessToken, refreshToken, user: safeUser };
}

export async function logout(userId, refreshToken) {
  const redis = getRedis();
  if (refreshToken) {
    await redis.setex(`blacklist:${refreshToken}`, 7 * 86400, '1');
  }
  await redis.del(`refresh:${userId}`);
}

export async function verifyEmail(token) {
  const hashed = crypto.createHash('sha256').update(token).digest('hex');
  const user = await User.findOne({
    emailVerifyToken: hashed,
    emailVerifyExpiry: { $gt: new Date() },
  }).select('+emailVerifyToken +emailVerifyExpiry');

  if (!user) throw new ApiError(400, 'Invalid or expired verification link');

  await User.findByIdAndUpdate(user._id, {
    isEmailVerified: true,
    emailVerifyToken: null,
    emailVerifyExpiry: null,
  });

  return { message: 'Email verified successfully' };
}

export async function forgotPassword(email) {
  const user = await User.findOne({ email });
  if (!user) return { message: 'If that email exists, a reset link has been sent.' };

  const resetToken = generateEmailToken();
  const hashed = crypto.createHash('sha256').update(resetToken).digest('hex');

  await User.findByIdAndUpdate(user._id, {
    passwordResetToken: hashed,
    passwordResetExpiry: new Date(Date.now() + PASSWORD_RESET_EXPIRY_HOURS * 3600 * 1000),
  });

  const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
  await sendEmail({
    to: email,
    subject: 'Reset your CodeMarket password',
    html: passwordResetTemplate(user.name, resetUrl),
  });

  return { message: 'If that email exists, a reset link has been sent.' };
}

export async function resetPassword(token, newPassword) {
  const hashed = crypto.createHash('sha256').update(token).digest('hex');
  const user = await User.findOne({
    passwordResetToken: hashed,
    passwordResetExpiry: { $gt: new Date() },
  }).select('+passwordResetToken +passwordResetExpiry');

  if (!user) throw new ApiError(400, 'Invalid or expired reset link');

  user.password = newPassword;
  user.passwordResetToken = undefined;
  user.passwordResetExpiry = undefined;
  await user.save();

  return { message: 'Password reset successful. You can now log in.' };
}

export async function refreshAccessToken(oldRefreshToken) {
  let decoded;
  try {
    decoded = verifyRefreshToken(oldRefreshToken);
  } catch {
    throw new ApiError(401, 'Invalid refresh token');
  }

  const redis = getRedis();
  const isBlacklisted = await redis.get(`blacklist:${oldRefreshToken}`);
  if (isBlacklisted) throw new ApiError(401, 'Token has been revoked');

  const storedToken = await redis.get(`refresh:${decoded.userId}`);
  if (storedToken !== oldRefreshToken) throw new ApiError(401, 'Refresh token mismatch');

  const user = await User.findById(decoded.userId);
  if (!user || user.status !== 'active') throw new ApiError(401, 'User not found or inactive');

  const { accessToken, refreshToken: newRefreshToken } = generateTokens(user._id, user.role);

  await redis.del(`refresh:${decoded.userId}`);
  await redis.setex(`blacklist:${oldRefreshToken}`, 7 * 86400, '1');
  await redis.setex(`refresh:${decoded.userId}`, 7 * 86400, newRefreshToken);

  return { accessToken, refreshToken: newRefreshToken };
}
