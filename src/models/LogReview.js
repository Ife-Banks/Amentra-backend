import mongoose from 'mongoose';

const logReviewSchema = new mongoose.Schema(
  {
    logEntryId: { type: mongoose.Schema.Types.ObjectId, ref: 'LogEntry', required: true, unique: true },
    supervisorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    institutionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Institution', required: true },
    decision: { type: String, enum: ['approved', 'rejected'], required: true },
    comment: { type: String, default: '' },
    rating: { type: Number, min: 1, max: 5, default: null },
    reviewedAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

const LogReview = mongoose.model('LogReview', logReviewSchema);
export default LogReview;
