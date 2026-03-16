import mongoose from 'mongoose';

const reportJobSchema = new mongoose.Schema(
  {
    institutionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Institution', required: true },
    requestedById: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    reportType: {
      type: String,
      enum: ['progress', 'engagement', 'performance', 'student_full'],
      required: true,
    },
    status: {
      type: String,
      enum: ['queued', 'processing', 'completed', 'failed'],
      default: 'queued',
    },
    format: { type: String, enum: ['pdf', 'excel'], required: true },
    fileUrl: { type: String, default: null },
    dateRangeStart: { type: Date, default: null },
    dateRangeEnd: { type: Date, default: null },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

const ReportJob = mongoose.model('ReportJob', reportJobSchema);
export default ReportJob;
