import mongoose from 'mongoose';

const retentionDays = parseInt(process.env.AUDIT_LOG_RETENTION_DAYS || '90', 10);

const auditLogSchema = new mongoose.Schema(
  {
    institutionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Institution', required: true },
    actorUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    action: { type: String, required: true },
    entityType: { type: String, required: true },
    entityId: { type: mongoose.Schema.Types.ObjectId, default: null },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    ipAddress: { type: String, default: null },
    occurredAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

auditLogSchema.index({ occurredAt: -1 });
auditLogSchema.index({ actorUserId: 1 });
auditLogSchema.index({ entityType: 1, entityId: 1 });
auditLogSchema.index({ occurredAt: 1 }, { expireAfterSeconds: retentionDays * 24 * 60 * 60 });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);
export default AuditLog;
