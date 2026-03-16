import mongoose from 'mongoose';

const systemConfigSchema = new mongoose.Schema(
  {
    institutionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Institution', required: true, unique: true },
    requiredLogCount: { type: Number, default: 60 },
    minLogDescriptionLength: { type: Number, default: 50 },
    maxFileSizeMb: { type: Number, default: 5 },
    allowedFileTypes: {
      type: [String],
      default: ['image/jpeg', 'image/png', 'application/pdf'],
    },
    siwesDurationWeeks: { type: Number, default: 24 },
    techSkillWeight: { type: Number, default: 0.4 },
    workEthicWeight: { type: Number, default: 0.3 },
    commWeight: { type: Number, default: 0.15 },
    probSolvingWeight: { type: Number, default: 0.15 },
  },
  { timestamps: { createdAt: false, updatedAt: true } }
);

const SystemConfig = mongoose.model('SystemConfig', systemConfigSchema);
export default SystemConfig;
