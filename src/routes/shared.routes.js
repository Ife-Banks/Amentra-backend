import { Router } from 'express';
import * as sharedController from '../controllers/shared.controller.js';
import { verifyToken } from '../middleware/auth.js';
import { attachTenant } from '../middleware/tenant.js';

const router = Router();

router.get('/health', sharedController.health);

router.get('/reports/:jobId/status', verifyToken, attachTenant, sharedController.getReportJobStatus);
router.get('/reports/:jobId/download', verifyToken, attachTenant, sharedController.downloadReport);

router.get('/search', verifyToken, attachTenant, sharedController.globalSearch);

export default router;
