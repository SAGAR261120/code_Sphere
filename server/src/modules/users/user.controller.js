import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import * as userService from './user.service.js';
import * as notifService from '../notifications/notification.service.js';
import { changePasswordSchema } from '../auth/auth.validation.js';
import { ApiError } from '../../utils/ApiError.js';

export const getProfile = asyncHandler(async (req, res) => {
  const user = await userService.getProfile(req.user._id);
  res.json(new ApiResponse(200, user));
});

export const updateProfile = asyncHandler(async (req, res) => {
  const user = await userService.updateProfile(req.user._id, req.body);
  res.json(new ApiResponse(200, user, 'Profile updated'));
});

export const changePassword = asyncHandler(async (req, res) => {
  const parsed = changePasswordSchema.safeParse(req.body);
  if (!parsed.success) throw new ApiError(422, 'Validation failed', parsed.error.issues);
  const result = await userService.changePassword(req.user._id, parsed.data.currentPassword, parsed.data.newPassword);
  res.json(new ApiResponse(200, null, result.message));
});

export const getDashboardSummary = asyncHandler(async (req, res) => {
  const data = await userService.getDashboardSummary(req.user._id);
  res.json(new ApiResponse(200, data));
});

export const getReferralStats = asyncHandler(async (req, res) => {
  const data = await userService.getReferralStats(req.user._id);
  res.json(new ApiResponse(200, data));
});

export const getNotifications = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const data = await notifService.getUserNotifications(req.user._id, page);
  res.json(new ApiResponse(200, data));
});

export const markNotificationRead = asyncHandler(async (req, res) => {
  await notifService.markNotificationRead(req.params.id, req.user._id);
  res.json(new ApiResponse(200, null, 'Marked as read'));
});

export const markAllNotificationsRead = asyncHandler(async (req, res) => {
  await notifService.markAllRead(req.user._id);
  res.json(new ApiResponse(200, null, 'All notifications marked as read'));
});

export const getUnreadCount = asyncHandler(async (req, res) => {
  const count = await notifService.getUnreadCount(req.user._id);
  res.json(new ApiResponse(200, { count }));
});
