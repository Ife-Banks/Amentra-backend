import mongoose from 'mongoose';

const supervisorSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    institutionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Institution', required: true },
    departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
    company: { type: String, default: '' },
    companyAddress: { type: String, default: '' },
  },
  { timestamps: true }
);

const Supervisor = mongoose.model('Supervisor', supervisorSchema);
export default Supervisor;
