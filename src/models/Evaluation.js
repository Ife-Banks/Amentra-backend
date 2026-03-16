import mongoose from 'mongoose';

const evaluationSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    supervisorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    institutionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Institution', required: true },
    sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'AcademicSession', required: true },
    type: { type: String, enum: ['midterm', 'final'], required: true },
    technicalSkillScore: { type: Number, required: true, min: 0, max: 100 },
    workEthicScore: { type: Number, required: true, min: 0, max: 100 },
    communicationScore: { type: Number, required: true, min: 0, max: 100 },
    problemSolvingScore: { type: Number, required: true, min: 0, max: 100 },
    remarks: { type: String, default: '' },
    submittedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

evaluationSchema.index({ studentId: 1, sessionId: 1, type: 1 }, { unique: true });

evaluationSchema.virtual('weightedTotal').get(function () {
  const t = (this.technicalSkillScore || 0) * 0.4;
  const w = (this.workEthicScore || 0) * 0.3;
  const c = (this.communicationScore || 0) * 0.15;
  const p = (this.problemSolvingScore || 0) * 0.15;
  return Math.round((t + w + c + p) * 100) / 100;
});

evaluationSchema.set('toJSON', { virtuals: true });

const Evaluation = mongoose.model('Evaluation', evaluationSchema);
export default Evaluation;
