import { Router } from 'express';
import * as ctrl from './task.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { isAdmin } from '../../middleware/rbac.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import { taskRateLimiter } from '../../middleware/rateLimit.middleware.js';
import { createTaskSchema, updateTaskSchema } from './task.validation.js';

const router = Router();

router.use(authenticate);

// User
router.get('/', ctrl.listTasks);
router.get('/my/history', ctrl.getUserTaskHistory);
router.get('/:id', ctrl.getTask);
router.post('/:id/start', taskRateLimiter, ctrl.startTask);
router.post('/:id/verify', ctrl.verifyTask);

// Admin
router.post('/', isAdmin, validate(createTaskSchema), ctrl.adminCreateTask);
router.patch('/:id', isAdmin, validate(updateTaskSchema), ctrl.adminUpdateTask);
router.delete('/:id', isAdmin, ctrl.adminDeleteTask);
router.get('/admin/sessions', isAdmin, ctrl.adminListSessions);

export default router;
