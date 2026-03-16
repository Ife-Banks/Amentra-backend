import mongoose from 'mongoose';

const studentSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    institutionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Institution', required: true },
    departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
    matricNumber: { type: String, required: true },
    company: { type: String, default: '' },
    companyAddress: { type: String, default: '' },
    companyState: { type: String, default: '' },
    companyCity: { type: String, default: '' },
    startDate: { type: Date, default: null },
    endDate: { type: Date, default: null },
    sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'AcademicSession', default: null },
  },
  { timestamps: true }
);

studentSchema.index({ institutionId: 1, matricNumber: 1 }, { unique: true });

const Student = mongoose.model('Student', studentSchema);
export default Student;
