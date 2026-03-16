import { Router } from 'express';
import authRoutes from './auth.routes.js';
import sharedRoutes from './shared.routes.js';
import superAdminRoutes, {
  departmentRouter,
  sessionRouter,
  configRouter,
  notificationTemplatesRouter,
} from './superAdmin.routes.js';
import bulkImportRoutes from './bulkImport.routes.js';
import adminRoutes from './admin.routes.js';
import supervisorRoutes from './supervisor.routes.js';
import studentRoutes from './student.routes.js';
import { verifyToken, requireRole } from '../middleware/auth.js';
import { attachTenant } from '../middleware/tenant.js';

const router = Router();

router.use('/auth', authRoutes);
router.use(sharedRoutes);

const superAdminMw = [verifyToken, requireRole('super_admin'), attachTenant];
router.use('/departments', ...superAdminMw, departmentRouter);
router.use('/sessions', ...superAdminMw, sessionRouter);
router.use('/config', ...superAdminMw, configRouter);
router.use('/notifications/templates', ...superAdminMw, notificationTemplatesRouter);

router.use('/super-admin', ...superAdminMw, superAdminRoutes);
router.use('/bulk-import', bulkImportRoutes);
router.use('/admin', adminRoutes);
router.use('/supervisor', supervisorRoutes);
router.use('/student', studentRoutes);

export default router;
