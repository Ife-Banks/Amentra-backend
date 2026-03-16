import mongoose from 'mongoose';

const notificationTemplateSchema = new mongoose.Schema(
  {
    institutionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Institution', required: true },
    name: { type: String, required: true },
    subject: { type: String, default: '' },
    body: { type: String, default: '' },
  },
  { timestamps: true }
);

notificationTemplateSchema.index({ institutionId: 1, name: 1 }, { unique: true });

const NotificationTemplate = mongoose.model('NotificationTemplate', notificationTemplateSchema);
export default NotificationTemplate;
