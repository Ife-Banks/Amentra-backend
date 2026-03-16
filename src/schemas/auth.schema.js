import { z } from 'zod';

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

export const registerOrganizationSchema = z.object({
  institutionName: z.string().min(1),
  address: z.string().min(1),
  type: z.enum(['University', 'Polytechnic']),
  adminName: z.string().min(1),
  adminEmail: z.string().email(),
  adminPassword: passwordSchema,
});

export const verifyEmailSchema = z.object({
  token: z.string().min(1),
});

export const resendVerificationSchema = z.object({
  email: z.string().email(),
});

export const loginSchema = z.object({
  identifier: z.string().min(1), // Can be email, staffId, or matricNumber
  password: z.string().min(1),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().nullable().optional(),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  newPassword: passwordSchema,
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: passwordSchema,
});

export const updateMeSchema = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().optional(),
});

// First login flow schemas
export const sendOTPSchema = z.object({
  userId: z.string().min(1),
  email: z.string().email(),
});

export const verifyOTPSchema = z.object({
  userId: z.string().min(1),
  otp: z.string().length(6, 'OTP must be 6 digits'),
});

export const changePasswordFirstLoginSchema = z.object({
  userId: z.string().min(1),
  newPassword: passwordSchema,
});
