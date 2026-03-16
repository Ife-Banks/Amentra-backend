import mongoose from 'mongoose';

const logEntrySchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    institutionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Institution', required: true },
    sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'AcademicSession', required: true },
    date: { type: Date, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    hoursWorked: { type: Number, required: true, min: 1, max: 24 },
    skillsLearned: [{ type: String }],
    challenges: { type: String, default: '' },
    status: {
      type: String,
      enum: ['draft', 'submitted', 'approved', 'rejected'],
      default: 'draft',
    },
    submittedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

logEntrySchema.index({ studentId: 1, date: 1 });
logEntrySchema.index({ institutionId: 1, status: 1 });

const LogEntry = mongoose.model('LogEntry', logEntrySchema);
export default LogEntry;
