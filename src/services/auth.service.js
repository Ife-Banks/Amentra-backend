import crypto from 'crypto';
import Institution from '../models/Institution.js';
import User from '../models/User.js';
import Department from '../models/Department.js';
import SystemConfig from '../models/SystemConfig.js';
import DefaultPassword from '../models/DefaultPassword.js';
import { hashPassword } from '../utils/password.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt.js';
import getRedisClient from '../config/redis.js';
import { sendVerificationEmail, sendPasswordResetEmail } from './email.service.js';
import logger from '../utils/logger.js';

export const registerOrganization = async (data) => {
  const slug = Institution.generateSlug(data.institutionName);
  const existing = await Institution.findOne({ slug });
  if (existing) throw new Error('Institution with this name already exists');

  const institution = await Institution.create({
    name: data.institutionName,
    address: data.address,
    type: data.type,
    slug,
  });

  const passwordHash = await hashPassword(data.adminPassword);
  const user = await User.create({
    institutionId: institution._id,
    departmentId: null,
    name: data.adminName,
    email: data.adminEmail,
    passwordHash,
    role: 'super_admin',
    isActive: true,
    mustChangePassword: false,
  });

  await SystemConfig.create({
    institutionId: institution._id,
  });

  const defaults = [
    { role: 'admin', password: 'Admin@123' },
    { role: 'supervisor', password: 'Supervisor@123' },
    { role: 'student', password: 'Student@123' },
  ];
  for (const d of defaults) {
    await DefaultPassword.create({
      institutionId: institution._id,
      role: d.role,
      passwordHash: await hashPassword(d.password),
    });
  }

  const token = crypto.randomBytes(32).toString('hex');
  user.emailVerificationToken = crypto.createHash('sha256').update(token).digest('hex');
  user.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await user.save();

  try {
    await sendVerificationEmail(user.email, token);
  } catch (emailError) {
    logger.warn(`Welcome/verification email failed to send: ${emailError.message}`);
  }

  return {
    institution: { id: institution._id, name: institution.name, slug: institution.slug, type: institution.type },
    user: { id: user._id, name: user.name, email: user.email, role: user.role },
  };
};

export const verifyEmail = async (token) => {
  const hashed = crypto.createHash('sha256').update(token).digest('hex');
  const user = await User.findOne({
    emailVerificationToken: hashed,
    emailVerificationExpires: { $gt: new Date() },
  });
  if (!user) throw new Error('Invalid or expired verification token');
  user.isEmailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpires = undefined;
  await user.save();
  return true;
};

export const resendVerification = async (email) => {
  const user = await User.findOne({ email });
  if (!user) return;
  if (user.isEmailVerified) return;
  const token = crypto.randomBytes(32).toString('hex');
  user.emailVerificationToken = crypto.createHash('sha256').update(token).digest('hex');
  user.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await user.save();
  try {
    await sendVerificationEmail(user.email, token);
  } catch (emailError) {
    logger.warn(`Resend verification email failed to send: ${emailError.message}`);
  }
};

export const login = async (identifier, password) => {
  try {
    console.log('Login attempt for:', identifier);
    console.log('Password provided:', !!password);
    
    // Check if identifier is email (for admin/super_admin) or staffId/matricNumber
    const isEmail = identifier.includes('@');
    let user;
    
    if (isEmail) {
      // Email login for admin/super_admin
      user = await User.findOne({ email: identifier, isActive: true }).select('+passwordHash');
    } else {
      // Staff ID or Matric Number login for staff/students
      user = await User.findOne({ 
        $or: [
          { staffId: identifier, isActive: true },
          { matricNumber: identifier, isActive: true }
        ]
      }).select('+passwordHash');
    }
    
    console.log('User found:', !!user);
    if (!user) {
      return { success: false, message: "Invalid credentials" };
    }
    
    if (!user.passwordHash) {
      return { success: false, message: "Account setup incomplete. Contact admin." };
    }
    
    const match = await user.comparePassword(password);
    console.log('Password comparison details:');
    console.log('- Provided password:', password);
    console.log('- Stored hash length:', user.passwordHash ? user.passwordHash.length : 'null');
    console.log('- Password valid:', match);
    if (!match) {
      return { success: false, message: "Invalid credentials" };
    }

    console.log('About to update user.lastLoginAt');
    user.lastLoginAt = new Date();
    console.log('About to save user with validateBeforeSave: false');
    await user.save({ validateBeforeSave: false });
    console.log('User saved successfully');
    
    // Check if this is first login for staff/students/admins
    if (user.isFirstLogin && ['supervisor', 'student', 'admin'].includes(user.role)) {
      console.log('First login detected for:', user.role);
      console.log('Returning first login response with userId:', user._id.toString());
      
      // Generate limited-scope temp token for first login flow
      const tempToken = signAccessToken({
        userId: user._id.toString(),
        purpose: 'first-login',
        institutionId: user.institutionId?.toString(),
      });
      
      // Return special response for first login flow
      return {
        success: true,
        isFirstLogin: true,
        userId: user._id.toString(),
        userName: user.name,
        userEmail: user.email || null,
        tempToken,
        user: {
          id: user._id,
          name: user.name,
          role: user.role,
          institutionId: user.institutionId,
          departmentId: user.departmentId,
          email: user.email,
        },
      };
    }

  console.log('Signing token with:', { 
    userId: user._id.toString(), 
    institutionId: user.institutionId.toString() 
  });

  const payload = {
    userId: user._id.toString(),
    institutionId: user.institutionId.toString(),
    role: user.role,
    departmentId: user.departmentId ? user.departmentId.toString() : null,
  };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  const redis = getRedisClient();
  await redis.setex(`refresh:${user._id}`, 7 * 24 * 60 * 60, refreshToken);

  return {
    success: true,
    accessToken,
    refreshToken,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      institutionId: user.institutionId,
      departmentId: user.departmentId,
      mustChangePassword: user.mustChangePassword,
    },
  };
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, message: "Internal server error", error: error.message };
  }
};

export const generateOTP = async (userId, email) => {
  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  
  // Hash the OTP
  const { hashPassword } = await import('../utils/password.js');
  const otpHash = await hashPassword(otp);
  
  // Set expiry to 10 minutes from now
  const expiry = new Date(Date.now() + 10 * 60 * 1000);
  
  // Update user with OTP hash and expiry
  await User.findByIdAndUpdate(userId, {
    otp: otpHash,
    otpExpiry: expiry,
    email: email, // Update email if provided
  });
  
  // Send OTP via email
  try {
    await sendVerificationEmail(email, otp, true); // true indicates it's an OTP
    console.log('OTP sent to:', email);
  } catch (emailError) {
    console.warn('OTP email failed:', emailError.message);
    throw new Error('Failed to send OTP. Please try again.');
  }
  
  return { success: true, message: 'OTP sent successfully' };
};

export const verifyOTP = async (userId, otp) => {
  const user = await User.findById(userId).select('+otp +otpExpiry');
  
  if (!user || !user.otp || !user.otpExpiry) {
    throw new Error('No OTP found. Please request a new one.');
  }
  
  // Check if OTP has expired
  if (new Date() > user.otpExpiry) {
    throw new Error('OTP has expired. Please request a new one.');
  }
  
  // Verify OTP
  const isValid = await bcrypt.compare(otp, user.otp);
  if (!isValid) {
    throw new Error('Invalid OTP');
  }
  
  // Clear OTP fields after successful verification
  await User.findByIdAndUpdate(userId, {
    $unset: { otp: 1, otpExpiry: 1 }
  });
  
  return { success: true, message: 'OTP verified successfully' };
};

export const changePasswordFirstLogin = async (userId, newPassword) => {
  const { hashPassword } = await import('../utils/password.js');
  const passwordHash = await hashPassword(newPassword);
  
  // Update password and clear first login flag
  await User.findByIdAndUpdate(userId, {
    passwordHash,
    isFirstLogin: false,
    $unset: { otp: 1, otpExpiry: 1 }
  });
  
  return { success: true, message: 'Password changed successfully' };
};

export const refreshAccessToken = async (refreshToken) => {
  const decoded = verifyRefreshToken(refreshToken);
  const redis = getRedisClient();
  const stored = await redis.get(`refresh:${decoded.userId}`);
  if (!stored || stored !== refreshToken) throw new Error('Invalid refresh token');
  const payload = {
    userId: decoded.userId,
    institutionId: decoded.institutionId,
    role: decoded.role,
    departmentId: decoded.departmentId || null,
  };
  const newAccess = signAccessToken(payload);
  const newRefresh = signRefreshToken(payload);
  await redis.setex(`refresh:${decoded.userId}`, 7 * 24 * 60 * 60, newRefresh);
  return { accessToken: newAccess, refreshToken: newRefresh };
};

export const logout = async (userId) => {
  const redis = getRedisClient();
  await redis.del(`refresh:${userId}`);
};

export const forgotPassword = async (email) => {
  const user = await User.findOne({ email });
  if (!user) return;
  const token = crypto.randomBytes(32).toString('hex');
  user.passwordResetToken = crypto.createHash('sha256').update(token).digest('hex');
  user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000);
  await user.save({ validateBeforeSave: false });
  try {
    await sendPasswordResetEmail(user.email, token);
  } catch (emailError) {
    logger.warn(`Password reset email failed to send: ${emailError.message}`);
  }
};

export const resetPassword = async (token, newPassword) => {
  const hashed = crypto.createHash('sha256').update(token).digest('hex');
  const user = await User.findOne({
    passwordResetToken: hashed,
    passwordResetExpires: { $gt: new Date() },
  });
  if (!user) throw new Error('Invalid or expired reset token');
  user.passwordHash = await hashPassword(newPassword);
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  user.mustChangePassword = false;
  await user.save();
  return true;
};

export const changePassword = async (userId, currentPassword, newPassword) => {
  const user = await User.findById(userId).select('+passwordHash');
  if (!user) throw new Error('User not found');
  const match = await user.comparePassword(currentPassword);
  if (!match) throw new Error('Current password is incorrect');
  user.passwordHash = await hashPassword(newPassword);
  user.mustChangePassword = false;
  await user.save();
  return true;
};

export const getMe = async (userId) => {
  const user = await User.findById(userId)
    .select('-passwordHash -emailVerificationToken -passwordResetToken')
    .populate('institutionId', 'name slug')
    .populate('departmentId', 'name faculty')
    .lean();
  if (!user) throw new Error('User not found');
  return user;
};

export const updateMe = async (userId, data) => {
  const user = await User.findByIdAndUpdate(
    userId,
    { $set: data },
    { new: true }
  ).select('-passwordHash -emailVerificationToken -passwordResetToken');
  if (!user) throw new Error('User not found');
  return user;
};

export const getInstitution = async (institutionId) => {
  const institution = await Institution.findById(institutionId).lean();
  if (!institution) throw new Error('Institution not found');
  return institution;
};
