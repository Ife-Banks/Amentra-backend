import { z } from 'zod';

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

export const createAdminSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  staffId: z.string().min(1), // Required for admin
  departmentId: z.string().min(1),
  password: passwordSchema.optional(),
});

export const createSupervisorSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  staffId: z.string().min(1), // Required for supervisor
  departmentId: z.string().min(1),
  company: z.string().optional(),
  companyAddress: z.string().optional(),
  password: z.string().optional(),
});

export const createStudentSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  matricNumber: z.string().min(1), // Required for student
  departmentId: z.string().min(1),
  company: z.string().optional(),
  companyAddress: z.string().optional(),
  companyState: z.string().optional(),
  companyCity: z.string().optional(),
  sessionId: z.string().min(1),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  password: z.string().optional(),
});

export const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  departmentId: z.string().optional().nullable(),
});

export const changeRoleSchema = z.object({
  role: z.enum(['super_admin', 'admin', 'supervisor', 'student']),
});

export const defaultPasswordSchema = z.object({
  password: passwordSchema,
});
