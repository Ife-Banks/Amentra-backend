import mongoose from 'mongoose';

const logMediaSchema = new mongoose.Schema(
  {
    logEntryId: { type: mongoose.Schema.Types.ObjectId, ref: 'LogEntry', required: true },
    institutionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Institution', required: true },
    uploader: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    cloudinaryPublicId: { type: String, required: true },
    url: { type: String, required: true },
    fileType: { type: String, enum: ['image', 'document'], required: true },
    originalName: { type: String, required: true },
    sizeBytes: { type: Number, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

const LogMedia = mongoose.model('LogMedia', logMediaSchema);
export default LogMedia;
