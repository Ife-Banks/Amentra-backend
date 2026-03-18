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

  // Create super admin user - passwordHash will be hashed by pre-save hook
  const user = await User.create({
    institutionId: institution._id,
    departmentId: null,
    name: data.adminName,
    email: data.adminEmail,
    passwordHash: data.adminPassword,  // Plain password - hook will hash it
    role: 'super_admin',
    isActive: true,
    mustChangePassword: false,
  });

  await SystemConfig.create({
    institutionId: institution._id,
  });

  const defaults = [
    { role: 'admin', password: 'Admin@12345' },
    { role: 'supervisor', password: 'Supervisor@12345' },
    { role: 'student', password: 'Student@12345' },
  ];
  for (const d of defaults) {
    await DefaultPassword.create({
      institutionId: institution._id,
      role: d.role,
      passwordHash: await hashPassword(d.password),
    });
  }

  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  // Store hashed OTP in DB
  user.emailVerificationToken = crypto.createHash('sha256').update(otp).digest('hex');
  // Expires in 30 minutes
  user.emailVerificationExpires = new Date(Date.now() + 30 * 60 * 1000);
  await user.save();

  // Log OTP for testing
  console.log('=== EMAIL VERIFICATION OTP ===');
  console.log('Email:', user.email);
  console.log('OTP:', otp);
  console.log('==============================');

  // Send OTP via email (not a link)
  try {
    await sendVerificationEmail(user.email, otp);
  } catch (emailError) {
    logger.warn(`Welcome/verification email failed to send: ${emailError.message}`);
  }

  return {
    institution: { id: institution._id, name: institution.name, slug: institution.slug, type: institution.type },
    user: { id: user._id, name: user.name, email: user.email, role: user.role },
  };
};

export const verifyEmail = async (token) => {
  // Hash the OTP the user entered
  const hashed = crypto.createHash('sha256').update(token).digest('hex');
  
  const user = await User.findOne({
    emailVerificationToken: hashed,
    emailVerificationExpires: { $gt: new Date() },
  });
  
  if (!user) {
    throw new Error('Invalid or expired verification code. Please request a new one.');
  }
  
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
  
  // Generate new 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  user.emailVerificationToken = crypto.createHash('sha256').update(otp).digest('hex');
  user.emailVerificationExpires = new Date(Date.now() + 30 * 60 * 1000);
  await user.save();
  
  // Log OTP for testing without email
  console.log('=== RESEND VERIFICATION OTP ===');
  console.log('Email:', email);
  console.log('OTP:', otp);
  console.log('=================================');
  
  try {
    await sendVerificationEmail(user.email, otp);
  } catch (emailError) {
    logger.warn(`Resend verification email failed to send: ${emailError.message}`);
  }
};

export const login = async (identifier, password) => {
  console.log('Login attempt:', identifier);
  
  // Check if identifier is email or staffId
  const isEmail = identifier.includes('@');
  let user;
  
  if (isEmail) {
    // Email login
    user = await User.findOne({ 
      email: identifier.toLowerCase().trim(),
      isActive: true 
    }).select('+passwordHash');
  } else {
    // Staff ID login
    user = await User.findOne({ 
      staffId: identifier.trim(),
      isActive: true 
    }).select('+passwordHash');
  }
  
  if (!user) {
    return { success: false, message: 'Invalid email/staffId or password' };
  }
  
  if (!user.passwordHash) {
    return { success: false, message: 'Account setup incomplete. Contact your administrator.' };
  }
  
  const match = await user.comparePassword(password);
  if (!match) {
    return { success: false, message: 'Invalid email/staffId or password' };
  }
  
  user.lastLoginAt = new Date();
  await user.save({ validateBeforeSave: false });
  
  // Check if this is first login - redirect to password change
  if (user.isFirstLogin && ['admin', 'supervisor', 'student'].includes(user.role)) {
    const tempToken = signAccessToken({
      userId: user._id.toString(),
      purpose: 'first-login',
      institutionId: user.institutionId?.toString(),
    });
    
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
        email: user.email,
        role: user.role,
        institutionId: user.institutionId,
        departmentId: user.departmentId,
      },
    };
  }
    
    const payload = {
      userId: user._id.toString(),
      institutionId: user.institutionId.toString(),
      role: user.role,
      departmentId: user.departmentId?.toString() || null,
    };
    
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);
    
    try {
      const redis = getRedisClient();
      await redis.setex(
        `refresh:${user._id}`, 
        7 * 24 * 60 * 60, 
        refreshToken
      );
    } catch (redisErr) {
      console.warn('Redis token store failed (non-fatal):', redisErr.message);
    }
    
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
        departmentId: user.departmentId || null,
        mustChangePassword: user.mustChangePassword || false,
      },
    };
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

export const changePasswordFirstLogin = async (userId, newPassword) => {
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');
  
  user.passwordHash = await hashPassword(newPassword);
  user.isFirstLogin = false;
  await user.save();
  
  return { success: true, message: 'Password changed successfully' };
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
