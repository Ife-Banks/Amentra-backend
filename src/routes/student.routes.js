import { Router } from 'express';
import * as ctrl from '../controllers/student.controller.js';
import { verifyToken, requireRole } from '../middleware/auth.js';
import { attachTenant } from '../middleware/tenant.js';
import { validate } from '../middleware/validate.js';
import { uploadMultiple } from '../middleware/upload.js';
import { createLogSchema, updateLogSchema } from '../schemas/log.schema.js';

const mw = [verifyToken, requireRole('student'), attachTenant];

const router = Router();

router.get('/dashboard', ...mw, ctrl.getDashboard);
router.get('/dashboard/streak', ...mw, ctrl.getStreak);
router.get('/dashboard/weekly-chart', ...mw, ctrl.getWeeklyChart);

router.get('/logs', ...mw, ctrl.listLogs);
router.post('/logs', ...mw, validate(createLogSchema), ctrl.createLog);
router.get('/logs/:id', ...mw, ctrl.getLog);
router.put('/logs/:id', ...mw, validate(updateLogSchema), ctrl.updateLog);
router.delete('/logs/:id', ...mw, ctrl.deleteLog);
router.post('/logs/:id/submit', ...mw, ctrl.submitLog);
router.post('/logs/:id/media', ...mw, uploadMultiple('media', 5), ctrl.uploadLogMedia);
router.delete('/logs/:id/media/:mediaId', ...mw, ctrl.deleteLogMedia);

router.get('/evaluations', ...mw, ctrl.listEvaluations);
router.get('/progress', ...mw, ctrl.getProgress);

router.get('/notifications', ...mw, ctrl.listNotifications);
router.put('/notifications/:id/read', ...mw, ctrl.markNotificationRead);
router.put('/notifications/mark-all-read', ...mw, ctrl.markAllNotificationsRead);

router.get('/profile', ...mw, ctrl.getProfile);
router.put('/profile', ...mw, ctrl.updateProfile);
router.get('/export', ...mw, ctrl.exportData);

export default router;
