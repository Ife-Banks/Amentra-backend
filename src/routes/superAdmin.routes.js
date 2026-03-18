import { Router } from 'express';
import * as ctrl from '../controllers/superAdmin.controller.js';
import { validate } from '../middleware/validate.js';
import {
  departmentSchema,
  sessionSchema,
  systemConfigUpdateSchema,
  broadcastSchema,
} from '../schemas/config.schema.js';
import { createAdminSchema, createSupervisorSchema, createStudentSchema, updateUserSchema, changeRoleSchema, defaultPasswordSchema } from '../schemas/user.schema.js';
import { uploadCsv } from '../middleware/upload.js';

const router = Router();

router.get('/dashboard', ctrl.getDashboard);

router.get('/admins', ctrl.listAdmins);
/**
 * @swagger
 * /super-admin/admins:
 *   post:
 *     tags: [Super Admin]
 *     summary: Create a new department admin
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateAdminRequest'
 *     responses:
 *       201:
 *         description: Admin created, returns defaultPassword
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                     defaultPassword:
 *                       type: string
 *       400:
 *         description: Validation failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/admins', validate(createAdminSchema), ctrl.createAdmin);
router.get('/admins/:id', ctrl.getAdmin);
router.put('/admins/:id', validate(updateUserSchema), ctrl.updateAdmin);
router.put('/admins/:id/deactivate', ctrl.deactivateAdmin);
router.delete('/admins/:id', ctrl.deleteAdmin);

router.get('/supervisors', ctrl.listSupervisors);
/**
 * @swagger
 * /super-admin/supervisors:
 *   post:
 *     tags: [Super Admin]
 *     summary: Create a new supervisor
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateSupervisorRequest'
 *     responses:
 *       201:
 *         description: Supervisor created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Validation failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/supervisors', validate(createSupervisorSchema), ctrl.createSupervisor);
router.post('/supervisors/bulk-import', uploadCsv(), ctrl.createSupervisorsBulkImport);
router.get('/supervisors/:id', ctrl.getSupervisor);
router.put('/supervisors/:id', validate(updateUserSchema), ctrl.updateSupervisor);
router.put('/supervisors/:id/deactivate', ctrl.deactivateSupervisor);

router.get('/students', ctrl.listStudents);
/**
 * @swagger
 * /super-admin/students:
 *   post:
 *     tags: [Super Admin]
 *     summary: Create a new student
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateStudentRequest'
 *     responses:
 *       201:
 *         description: Student created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Validation failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/students', validate(createStudentSchema), ctrl.createStudent);
router.post('/students/bulk-import', uploadCsv(), ctrl.createStudentsBulkImport);
router.get('/students/:id', ctrl.getStudent);
router.put('/students/:id', validate(createStudentSchema.partial()), ctrl.updateStudent);
router.put('/students/:id/deactivate', ctrl.deactivateStudent);

/**
 * @swagger
 * /super-admin/users:
 *   get:
 *     tags: [Super Admin]
 *     summary: Get all users in the institution
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [admin, supervisor, student]
 *         description: Filter by role
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: List of users retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     users:
 *                       type: array
 *                       items:
 *                         type: object
 *                     pagination:
 *                       type: object
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/users', ctrl.listUsers);
router.put('/users/:id/role', validate(changeRoleSchema), ctrl.updateUserRole);
router.delete('/users/:id', ctrl.deleteUser);

router.get('/default-passwords', ctrl.getDefaultPasswords);
router.put('/default-passwords/:role', ctrl.updateDefaultPassword);

router.get('/notifications/templates', ctrl.listNotificationTemplates);
router.put('/notifications/templates/:id', ctrl.updateNotificationTemplate);
router.post('/notifications/broadcast', validate(broadcastSchema), ctrl.broadcast);

router.get('/audit-logs', ctrl.listAuditLogs);
router.post('/backup', ctrl.triggerBackup);
router.get('/export', ctrl.streamExport);

export default router;

export const departmentRouter = Router();
departmentRouter.get('/', ctrl.listDepartments);
departmentRouter.post('/', validate(departmentSchema), ctrl.createDepartment);
departmentRouter.get('/:id', ctrl.getDepartment);
departmentRouter.put('/:id', validate(departmentSchema.partial()), ctrl.updateDepartment);
departmentRouter.delete('/:id', ctrl.deleteDepartment);

export const sessionRouter = Router();
sessionRouter.get('/', ctrl.listSessions);
sessionRouter.post('/', validate(sessionSchema), ctrl.createSession);
sessionRouter.put('/:id', validate(sessionSchema), ctrl.updateSession);
sessionRouter.put('/:id/activate', ctrl.activateSession);
sessionRouter.put('/:id/lock', ctrl.lockSession);
sessionRouter.delete('/:id', ctrl.deleteSession);

export const configRouter = Router();
configRouter.get('/', ctrl.getConfig);
configRouter.put('/', validate(systemConfigUpdateSchema), ctrl.updateConfig);

export const notificationTemplatesRouter = Router();
notificationTemplatesRouter.get('/', ctrl.listNotificationTemplates);
notificationTemplatesRouter.put('/:id', ctrl.updateNotificationTemplate);
