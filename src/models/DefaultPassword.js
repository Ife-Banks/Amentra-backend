import mongoose from 'mongoose';

const defaultPasswordSchema = new mongoose.Schema(
  {
    institutionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Institution', required: true },
    role: { type: String, enum: ['admin', 'supervisor', 'student'], required: true },
    passwordHash: { type: String, required: true },
  },
  { timestamps: { createdAt: false, updatedAt: true } }
);

defaultPasswordSchema.index({ institutionId: 1, role: 1 }, { unique: true });

const DefaultPassword = mongoose.model('DefaultPassword', defaultPasswordSchema);
export default DefaultPassword;
