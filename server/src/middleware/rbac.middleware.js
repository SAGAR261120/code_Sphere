import { PERMISSIONS } from '../config/constants.js';
import { ApiError } from '../utils/ApiError.js';

export const requireRole = (...roles) => (req, _res, next) => {
  if (!req.user) throw new ApiError(401, 'Authentication required');
  if (!roles.includes(req.user.role)) {
    throw new ApiError(403, 'Insufficient permissions');
  }
  next();
};

export const requirePermission = (permission) => (req, _res, next) => {
  if (!req.user) throw new ApiError(401, 'Authentication required');
  const perms = PERMISSIONS[req.user.role] || [];
  if (!perms.includes('*') && !perms.includes(permission)) {
    throw new ApiError(403, 'Insufficient permissions');
  }
  next();
};

export const isAdmin = requireRole('admin', 'super_admin');
export const isModerator = requireRole('admin', 'super_admin', 'moderator');
export const isSuperAdmin = requireRole('super_admin');
