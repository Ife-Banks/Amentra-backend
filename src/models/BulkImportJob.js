import mongoose from 'mongoose';

const bulkImportJobSchema = new mongoose.Schema(
  {
    institutionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Institution', required: true },
    initiatedById: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    importType: { type: String, enum: ['admin', 'supervisor', 'student'], required: true },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending',
    },
    totalRows: { type: Number, default: 0 },
    rowsProcessed: { type: Number, default: 0 },
    rowsSucceeded: { type: Number, default: 0 },
    rowsFailed: { type: Number, default: 0 },
    errorFileUrl: { type: String, default: null },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

const BulkImportJob = mongoose.model('BulkImportJob', bulkImportJobSchema);
export default BulkImportJob;
