import AuditLog from '../models/AuditLog.js';
import { logger } from '../utils/logger.js';

export const auditLog = (action, entityType) => {
  return (req, res, next) => {
    const originalJson = res.json.bind(res);
    res.json = function (body) {
      if (req.user && req.institutionId) {
        const payload = {
          institutionId: req.institutionId,
          actorUserId: req.user.userId,
          action,
          entityType,
          entityId: req.params.id || null,
          metadata: req.body && typeof req.body === 'object' ? { ...req.body } : {},
          ipAddress: req.ip || req.connection?.remoteAddress,
        };
        AuditLog.create(payload).catch((err) => logger.error('Audit log write failed', err));
      }
      return originalJson(body);
    };
    next();
  };
};
