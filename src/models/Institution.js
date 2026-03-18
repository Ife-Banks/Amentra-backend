import mongoose from 'mongoose';

const institutionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    address: { type: String, required: true },
    type: { 
      type: String, 
      enum: ['University', 'Polytechnic', 'College_of_Education', 'Monotechnic', 'School_of_Nursing', 'Innovation_Enterprise_Institution', 'Vocational_Enterprise_Institution', 'Technical_College'], 
      required: true 
    },
    slug: { type: String, required: true, unique: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

institutionSchema.statics.generateSlug = function (name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
};

const Institution = mongoose.model('Institution', institutionSchema);
export default Institution;
