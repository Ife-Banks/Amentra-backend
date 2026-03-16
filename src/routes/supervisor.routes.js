import { Router } from 'express';
import * as ctrl from '../controllers/supervisor.controller.js';
import { verifyToken, requireRole } from '../middleware/auth.js';
import { attachTenant } from '../middleware/tenant.js';
import { validate } from '../middleware/validate.js';
import { createStudentSchema } from '../schemas/user.schema.js';
import { createLogSchema, approveLogSchema, rejectLogSchema, rateLogSchema } from '../schemas/log.schema.js';
import { createEvaluationSchema } from '../schemas/evaluation.schema.js';

const mw = [verifyToken, requireRole('supervisor'), attachTenant];

const router = Router();

router.get('/dashboard', ...mw, ctrl.getDashboard);
router.get('/profile', ...mw, ctrl.getProfile);
router.put('/profile', ...mw, ctrl.updateProfile);

router.get('/students', ...mw, ctrl.listStudents);
router.get('/students/search', ...mw, ctrl.searchStudents);
router.post('/students', ...mw, validate(createStudentSchema), ctrl.createStudent);
router.get('/students/:id', ...mw, ctrl.getStudent);

router.get('/logs', ...mw, ctrl.listLogs);
router.get('/logs/pending', ...mw, ctrl.listPendingLogs);
router.get('/logs/history', ...mw, ctrl.listLogHistory);
router.get('/logs/:id', ...mw, ctrl.getLog);
router.put('/logs/:id/approve', ...mw, validate(approveLogSchema), ctrl.approveLog);
router.put('/logs/:id/reject', ...mw, validate(rejectLogSchema), ctrl.rejectLog);
router.put('/logs/:id/rate', ...mw, validate(rateLogSchema), ctrl.rateLog);

router.get('/evaluations', ...mw, ctrl.listEvaluations);
router.post('/evaluations', ...mw, validate(createEvaluationSchema), ctrl.createEvaluation);
router.get('/evaluations/:id', ...mw, ctrl.getEvaluation);
router.put('/evaluations/:id', ...mw, validate(createEvaluationSchema.partial()), ctrl.updateEvaluation);

router.get('/students/:id/report', ...mw, ctrl.getStudentReport);
router.post('/students/:id/report/export', ...mw, ctrl.exportStudentReport);

router.get('/notifications', ...mw, ctrl.listNotifications);
router.get('/notifications/unread-count', ...mw, ctrl.getUnreadCount);
router.put('/notifications/:id/read', ...mw, ctrl.markNotificationRead);
router.put('/notifications/mark-all-read', ...mw, ctrl.markAllNotificationsRead);
router.get('/notifications/preferences', ...mw, ctrl.getNotificationPreferences);
router.put('/notifications/preferences', ...mw, ctrl.updateNotificationPreferences);

export default router;
