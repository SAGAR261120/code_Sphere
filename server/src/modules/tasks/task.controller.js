import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import * as taskService from './task.service.js';

export const listTasks = asyncHandler(async (req, res) => {
  const tasks = await taskService.listTasks(req.user._id);
  res.json(new ApiResponse(200, tasks));
});

export const getTask = asyncHandler(async (req, res) => {
  const task = await taskService.getTask(req.params.id);
  res.json(new ApiResponse(200, task));
});

export const startTask = asyncHandler(async (req, res) => {
  const result = await taskService.startTask(req.params.id, req.user._id, req);
  res.json(new ApiResponse(200, result, 'Task started. Complete within time limit.'));
});

export const verifyTask = asyncHandler(async (req, res) => {
  const { sessionToken, verificationData } = req.body;
  const result = await taskService.verifyTask(
    req.params.id, req.user._id, sessionToken, verificationData || {}, req
  );
  res.json(new ApiResponse(200, result, result.message));
});

export const getUserTaskHistory = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const data = await taskService.getUserTaskHistory(req.user._id, page);
  res.json(new ApiResponse(200, data));
});

// Admin
export const adminCreateTask = asyncHandler(async (req, res) => {
  const task = await taskService.createTask(req.body, req.user._id);
  res.status(201).json(new ApiResponse(201, task, 'Task created'));
});

export const adminUpdateTask = asyncHandler(async (req, res) => {
  const task = await taskService.updateTask(req.params.id, req.body);
  res.json(new ApiResponse(200, task, 'Task updated'));
});

export const adminDeleteTask = asyncHandler(async (req, res) => {
  await taskService.deleteTask(req.params.id);
  res.json(new ApiResponse(200, null, 'Task deleted'));
});

export const adminListSessions = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const { status } = req.query;
  const data = await taskService.adminListSessions(page, status);
  res.json(new ApiResponse(200, data));
});
