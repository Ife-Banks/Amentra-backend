import { Router } from 'express';
import * as ctrl from '../controllers/bulkImport.controller.js';
import { verifyToken, requireRole } from '../middleware/auth.js';
import { attachTenant } from '../middleware/tenant.js';
import { uploadCsv } from '../middleware/upload.js';

const router = Router();
const mw = [verifyToken, requireRole('super_admin', 'admin'), attachTenant];

router.post('/validate-csv', ...mw, uploadCsv(), ctrl.validateCsv);
router.get('/:jobId/status', ...mw, ctrl.getJobStatus);
router.get('/:jobId/errors', ...mw, ctrl.getJobErrors);

export default router;
