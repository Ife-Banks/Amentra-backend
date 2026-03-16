import * as authService from '../services/auth.service.js';
import { success, error } from '../utils/apiResponse.js';

export const registerOrganization = async (req, res, next) => {
  try {
    const data = req.validated || req.body;
    const result = await authService.registerOrganization(data);
    return success(res, result, 'Organization registered. Please verify your email.', 201);
  } catch (e) {
    next(e);
  }
};

export const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.validated || req.body;
    await authService.verifyEmail(token);
    return success(res, null, 'Email verified successfully.');
  } catch (e) {
    next(e);
  }
};

export const resendVerification = async (req, res, next) => {
  try {
    const { email } = req.validated || req.body;
    await authService.resendVerification(email);
    return success(res, null, 'If the email exists and is unverified, a new link was sent.');
  } catch (e) {
    next(e);
  }
};

export const login = async (req, res, next) => {
  console.log('Login request body:', req.body);
  try {
    const { identifier, password } = req.validated || req.body;
    const result = await authService.login(identifier, password);
    
    if (!result.success) {
      return res.status(401).json(result);
    }
    
    if (result.isFirstLogin) {
      // Special response for first login flow
      return success(res, result, 'First login detected. Please verify your email.', 200);
    }
    
    return success(res, result, 'Login successful.');
  } catch (e) {
    console.error('Login controller error:', e);
    return res.status(500).json({ success: false, message: "Internal server error", error: e.message });
  }
};

export const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.validated || req.body;
    const result = await authService.refreshAccessToken(refreshToken);
    return success(res, result, 'Token refreshed.');
  } catch (e) {
    next(e);
  }
};

export const logout = async (req, res, next) => {
  try {
    await authService.logout(req.user.userId);
    return success(res, null, 'Logged out.');
  } catch (e) {
    next(e);
  }
};

export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.validated || req.body;
    await authService.forgotPassword(email);
    return success(res, null, 'If the email exists, a reset link was sent.');
  } catch (e) {
    next(e);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.validated || req.body;
    await authService.resetPassword(token, newPassword);
    return success(res, null, 'Password reset successfully.');
  } catch (e) {
    next(e);
  }
};

export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.validated || req.body;
    await authService.changePassword(req.user.userId, currentPassword, newPassword);
    return success(res, null, 'Password changed.');
  } catch (e) {
    next(e);
  }
};

export const getMe = async (req, res, next) => {
  try {
    const user = await authService.getMe(req.user.userId);
    return success(res, user, 'Profile retrieved.');
  } catch (e) {
    next(e);
  }
};

export const updateMe = async (req, res, next) => {
  try {
    const data = req.validated || req.body;
    const user = await authService.updateMe(req.user.userId, data);
    return success(res, user, 'Profile updated.');
  } catch (e) {
    next(e);
  }
};

export const getInstitution = async (req, res, next) => {
  try {
    const institution = await authService.getInstitution(req.user.institutionId);
    return success(res, institution, 'Institution retrieved.');
  } catch (e) {
    next(e);
  }
};

export const sendOTP = async (req, res, next) => {
  try {
    const { userId, email } = req.validated || req.body;
    const result = await authService.generateOTP(userId, email);
    return success(res, result, 'OTP sent successfully.');
  } catch (e) {
    next(e);
  }
};

export const verifyOTP = async (req, res, next) => {
  try {
    const { userId, otp } = req.validated || req.body;
    const result = await authService.verifyOTP(userId, otp);
    return success(res, result, 'OTP verified successfully.');
  } catch (e) {
    next(e);
  }
};

export const changePasswordFirstLogin = async (req, res, next) => {
  try {
    const { userId, newPassword } = req.validated || req.body;
    const result = await authService.changePasswordFirstLogin(userId, newPassword);
    return success(res, result, 'Password changed successfully.');
  } catch (e) {
    next(e);
  }
};
