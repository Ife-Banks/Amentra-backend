import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const ROLES = ['super_admin', 'admin', 'supervisor', 'student'];

const userSchema = new mongoose.Schema(
  {
    institutionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Institution', required: true },
    departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', default: null },
    name: { type: String, required: true },
    email: { type: String, required: false }, // Made optional for first login flow
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ROLES, required: true },
    isActive: { type: Boolean, default: true },
    isEmailVerified: { type: Boolean, default: false },
    emailVerificationToken: { type: String, default: null },
    emailVerificationExpires: { type: Date, default: null },
    passwordResetToken: { type: String, default: null },
    passwordResetExpires: { type: Date, default: null },
    lastLoginAt: { type: Date, default: null },
    mustChangePassword: { type: Boolean, default: false },
    // New fields for first login flow
    staffId: { type: String, sparse: true, unique: true }, // For staff accounts
    matricNumber: { type: String, sparse: true, unique: true }, // For student accounts
    isFirstLogin: { type: Boolean, default: true }, // First login flag
    otp: { type: String, default: null }, // Hashed OTP storage
    otpExpiry: { type: Date, default: null }, // OTP expiry time
  },
  { timestamps: true }
);

userSchema.index({ institutionId: 1, email: 1 }, { unique: true, sparse: true }); // Make sparse since email is optional
userSchema.index({ institutionId: 1, staffId: 1 }, { unique: true, sparse: true }); // Staff ID unique per institution
userSchema.index({ institutionId: 1, matricNumber: 1 }, { unique: true, sparse: true }); // Matric number unique per institution

// Pre-save hook to hash password and update timestamps
userSchema.pre('save', async function () {
  // Skip password hashing if flag is set (escape hatch)
  if (this.$locals.skipPasswordHash) return;
  
  // Hash password if modified (field is named passwordHash)
  if (this.isModified('passwordHash') && this.passwordHash) {
    // Only hash if it doesn't already look like a bcrypt hash
    if (!this.passwordHash.startsWith('$2')) {
      this.passwordHash = await bcrypt.hash(this.passwordHash, 10);
    }
  }
  
  // Update timestamp
  this.updatedAt = new Date();
});

userSchema.methods.comparePassword = async function (plain) {
  console.log('Comparing password with hash length:', this.passwordHash ? this.passwordHash.length : 'null');
  console.log('Plain password length:', plain.length);
  const result = await bcrypt.compare(plain, this.passwordHash);
  console.log('Bcrypt comparison result:', result);
  return result;
};

userSchema.virtual('fullRole').get(function () {
  const labels = { super_admin: 'Super Admin', admin: 'Admin', supervisor: 'Supervisor', student: 'Student' };
  return labels[this.role] || this.role;
});

userSchema.set('toJSON', {
  virtuals: true,
  transform(doc, ret) {
    delete ret.passwordHash;
    delete ret.emailVerificationToken;
    delete ret.passwordResetToken;
    delete ret.otp; // Don't expose OTP hash
    return ret;
  },
});

const User = mongoose.model('User', userSchema);
export default User;
