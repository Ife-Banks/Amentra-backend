import { Router } from 'express';
import * as ctrl from '../controllers/admin.controller.js';
import { verifyToken, requireRole } from '../middleware/auth.js';
import { attachTenant } from '../middleware/tenant.js';
import { validate } from '../middleware/validate.js';
import { uploadMultiple, uploadCsv } from '../middleware/upload.js';
import { assignmentSchema, reassignSchema, siteVisitSchema } from '../schemas/config.schema.js';
import { createSupervisorSchema, createStudentSchema, updateUserSchema } from '../schemas/user.schema.js';
import { z } from 'zod';

const reportExportSchema = z.object({
  type: z.string(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  format: z.enum(['pdf', 'excel']),
});

const mw = [verifyToken, requireRole('admin', 'department_admin', 'super_admin', 'system_admin'), attachTenant];

const router = Router();

/**
 * @swagger
 * /admin/dashboard:
 *   get:
 *     tags: [Admin]
 *     summary: Get admin dashboard statistics
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         description: Unauthorized
 */
router.get('/dashboard', ...mw, ctrl.getDashboard);
router.get('/dashboard/submission-trends', ...mw, ctrl.getSubmissionTrends);
router.get('/dashboard/company-distribution', ...mw, ctrl.getCompanyDistribution);

router.get('/supervisors', ...mw, ctrl.listSupervisors);
router.post('/supervisors', ...mw, validate(createSupervisorSchema), ctrl.createSupervisor);
router.post('/supervisors/bulk-import', ...mw, uploadCsv(), ctrl.createSupervisorsBulkImport);
router.get('/supervisors/:id', ...mw, ctrl.getSupervisor);
router.put('/supervisors/:id', ...mw, validate(updateUserSchema), ctrl.updateSupervisor);
router.put('/supervisors/:id/deactivate', ...mw, ctrl.deactivateSupervisor);
router.delete('/supervisors/:id', ...mw, ctrl.deleteSupervisor);

/**
 * @swagger
 * /admin/students:
 *   get:
 *     tags: [Admin]
 *     summary: Get list of students in department
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Students retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/students', ...mw, ctrl.listStudents);
router.post('/students', ...mw, validate(createStudentSchema), ctrl.createStudent);
router.post('/students/bulk-import', ...mw, uploadCsv(), ctrl.createStudentsBulkImport);
router.get('/students/search', ...mw, ctrl.searchStudents);
router.get('/students/:id', ...mw, ctrl.getStudent);
router.put('/students/:id', ...mw, validate(createStudentSchema.partial()), ctrl.updateStudent);
router.put('/students/:id/deactivate', ...mw, ctrl.deactivateStudent);
router.delete('/students/:id', ...mw, ctrl.deleteStudent);

router.post('/assignments', ...mw, validate(assignmentSchema), ctrl.createAssignment);
router.get('/assignments', ...mw, ctrl.listAssignments);
router.put('/assignments/:id/reassign', ...mw, validate(reassignSchema), ctrl.reassign);
router.delete('/assignments/:id', ...mw, ctrl.deleteAssignment);

/**
 * @swagger
 * /admin/logs:
 *   get:
 *     tags: [Admin]
 *     summary: Get student activity logs
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, approved, rejected]
 *       - in: query
 *         name: studentId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Logs retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/logs', ...mw, ctrl.listLogs);
router.get('/logs/pending', ...mw, ctrl.listPendingLogs);
router.get('/logs/:id', ...mw, ctrl.getLog);

router.get('/evaluations', ...mw, ctrl.listEvaluations);
router.get('/evaluations/:id', ...mw, ctrl.getEvaluation);

router.get('/site-visits', ...mw, ctrl.listSiteVisits);
router.post('/site-visits', ...mw, validate(siteVisitSchema), ctrl.createSiteVisit);
router.get('/site-visits/:id', ...mw, ctrl.getSiteVisit);
router.put('/site-visits/:id', ...mw, validate(siteVisitSchema.partial()), ctrl.updateSiteVisit);
router.delete('/site-visits/:id', ...mw, ctrl.deleteSiteVisit);
router.post('/site-visits/:id/media', ...mw, uploadMultiple('media', 10), ctrl.addSiteVisitMedia);

router.get('/analytics', ...mw, ctrl.getAnalytics);
router.get('/reports', ...mw, ctrl.getReports);
router.post('/reports/export', ...mw, validate(reportExportSchema), ctrl.exportReport);

export default router;
