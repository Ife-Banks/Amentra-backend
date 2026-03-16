import User from '../models/User.js';
import Department from '../models/Department.js';
import Institution from '../models/Institution.js';

export const findById = async (userId, institutionId) => {
  const user = await User.findOne({ _id: userId, institutionId })
    .select('-passwordHash -emailVerificationToken -passwordResetToken')
    .populate('departmentId', 'name faculty')
    .lean();
  return user;
};

export const findByInstitution = async (institutionId, options = {}) => {
  const { role, page = 1, limit = 20 } = options;
  const filter = { institutionId };
  if (role) filter.role = role;
  const skip = (page - 1) * limit;
  const [docs, total] = await Promise.all([
    User.find(filter).select('-passwordHash -emailVerificationToken -passwordResetToken').sort({ createdAt: -1 }).skip(skip).limit(limit).populate('departmentId', 'name faculty').lean(),
    User.countDocuments(filter),
  ]);
  return { docs, total, page, pages: Math.ceil(total / limit) || 1, limit };
};

export const updateUserRole = async (userId, institutionId, role) => {
  const user = await User.findOneAndUpdate(
    { _id: userId, institutionId },
    { role },
    { new: true }
  ).select('-passwordHash -emailVerificationToken -passwordResetToken');
  return user;
};

export const deleteUser = async (userId, institutionId) => {
  const user = await User.findOneAndDelete({ _id: userId, institutionId });
  return user;
};
