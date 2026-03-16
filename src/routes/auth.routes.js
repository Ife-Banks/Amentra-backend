import { Router } from 'express';
import * as authController from '../controllers/auth.controller.js';
import { verifyToken } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { authLimiter, resendVerificationLimiter } from '../middleware/rateLimiter.js';
import {
  registerOrganizationSchema,
  verifyEmailSchema,
  resendVerificationSchema,
  loginSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  updateMeSchema,
  sendOTPSchema,
  verifyOTPSchema,
  changePasswordFirstLoginSchema,
} from '../schemas/auth.schema.js';

const router = Router();

router.use(authLimiter);

/**
 * @swagger
 * /auth/register-organization:
 *   post:
 *     summary: Register organization
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [institutionName, address, type, adminName, adminEmail, adminPassword]
 *             properties:
 *               institutionName:
 *                 type: string
 *               address:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [University, Polytechnic]
 *               adminName:
 *                 type: string
 *               adminEmail:
 *                 type: string
 *               adminPassword:
 *                 type: string
 *     responses:
 *       201:
 *         description: Organization registered
 *       400:
 *         description: Validation failed
 */
router.post('/register-organization', validate(registerOrganizationSchema), authController.registerOrganization);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */
router.post('/verify-email', validate(verifyEmailSchema), authController.verifyEmail);
router.post('/resend-verification', resendVerificationLimiter, validate(resendVerificationSchema), authController.resendVerification);
router.post('/login', validate(loginSchema), authController.login);

// First login flow routes
router.post('/send-otp', validate(sendOTPSchema), authController.sendOTP);
router.post('/verify-otp', validate(verifyOTPSchema), authController.verifyOTP);
router.post('/change-password-first-login', validate(changePasswordFirstLoginSchema), authController.changePasswordFirstLogin);

// Temporary password reset route (remove after use)
router.post('/temp-reset-password', async (req, res) => {
  try {
    const { staffId } = req.body;
    console.log('Reset requested for staffId:', staffId);
    
    if (!staffId) {
      return res.status(400).json({ success: false, message: 'Staff ID is required' });
    }
    
    const User = (await import('../models/User.js')).default;
    const { hashPassword } = await import('../utils/password.js');
    
    const user = await User.findOne({ staffId });
    console.log('User found:', !!user);
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    const plainPassword = `AMENTRA@${staffId}`;
    console.log('Plain password to hash:', plainPassword);
    
    const hashedPassword = await hashPassword(plainPassword);
    console.log('Hashed password successfully');
    
    // Use updateOne to bypass any hooks
    await User.updateOne({ staffId }, { $set: { passwordHash: hashedPassword } });
    
    console.log(`Password reset successfully for ${staffId}`);
    
    return res.json({ 
      success: true, 
      message: 'Password reset successfully',
      plainPassword 
    });
  } catch (error) {
    console.error('Password reset error:', error.message);
    console.error('Full error stack:', error.stack);
    return res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
});

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Logout user
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Logged out
 *       401:
 *         description: Unauthorized
 */
router.post('/refresh-token', validate(refreshTokenSchema), authController.refreshToken);
router.post('/logout', verifyToken, authController.logout);

/**
 * @swagger
 * /auth/refresh-token:
 *   post:
 *     summary: Refresh access token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Token refreshed
 *       401:
 *         description: Invalid refresh token
 */
router.post('/forgot-password', validate(forgotPasswordSchema), authController.forgotPassword);

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     summary: Forgot password
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: If email exists, reset link sent
 */
router.post('/reset-password', validate(resetPasswordSchema), authController.resetPassword);

/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     summary: Reset password
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token, newPassword]
 *             properties:
 *               token:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password reset successful
 *       400:
 *         description: Invalid or expired token
 */
router.post('/change-password', verifyToken, validate(changePasswordSchema), authController.changePassword);

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Get current user profile
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Profile retrieved
 *       401:
 *         description: Unauthorized
 */
router.get('/me', verifyToken, authController.getMe);
router.put('/me', verifyToken, validate(updateMeSchema), authController.updateMe);
router.get('/institution', verifyToken, authController.getInstitution);

export default router;
