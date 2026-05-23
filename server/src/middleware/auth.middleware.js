import { verifyAccessToken } from '../utils/tokenUtils.js';
import User from '../modules/users/user.model.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const authenticate = asyncHandler(async (req, _res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    throw new ApiError(401, 'Authentication required');
  }

  const token = authHeader.split(' ')[1];
  let decoded;
  try {
    decoded = verifyAccessToken(token);
  } catch (err) {
    throw new ApiError(401, err.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token');
  }

  const user = await User.findById(decoded.userId).select('-password');
  if (!user) throw new ApiError(401, 'User not found');
  if (user.status === 'banned') throw new ApiError(403, 'Account banned');
  if (user.status === 'suspended') {
    if (!user.banExpiresAt || user.banExpiresAt > new Date()) {
      throw new ApiError(403, 'Account suspended');
    }
    await User.findByIdAndUpdate(user._id, { status: 'active', banReason: null, banExpiresAt: null });
    user.status = 'active';
  }

  req.user = user;
  next();
});

export const optionalAuth = asyncHandler(async (req, _res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return next();
  try {
    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);
    const user = await User.findById(decoded.userId).select('-password');
    if (user && user.status === 'active') req.user = user;
  } catch {
    // silently ignore — guest access
  }
  next();
});
