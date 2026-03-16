import mongoose from 'mongoose';

const mediaUrlSchema = new mongoose.Schema(
  { cloudinaryPublicId: String, url: String },
  { _id: false }
);

const siteVisitSchema = new mongoose.Schema(
  {
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    institutionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Institution', required: true },
    departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
    company: { type: String, required: true },
    address: { type: String, default: '' },
    visitDate: { type: Date, required: true },
    notes: { type: String, default: '' },
    mediaUrls: [mediaUrlSchema],
    studentIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }],
  },
  { timestamps: true }
);

const SiteVisit = mongoose.model('SiteVisit', siteVisitSchema);
export default SiteVisit;
