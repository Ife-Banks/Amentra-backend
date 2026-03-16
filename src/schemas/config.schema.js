import { z } from 'zod';

export const systemConfigUpdateSchema = z
  .object({
    requiredLogCount: z.number().min(1).optional(),
    minLogDescriptionLength: z.number().min(1).optional(),
    maxFileSizeMb: z.number().min(1).optional(),
    allowedFileTypes: z.array(z.string()).optional(),
    siwesDurationWeeks: z.number().min(1).optional(),
    techSkillWeight: z.number().min(0).max(1).optional(),
    workEthicWeight: z.number().min(0).max(1).optional(),
    commWeight: z.number().min(0).max(1).optional(),
    probSolvingWeight: z.number().min(0).max(1).optional(),
  })
  .refine(
    (data) => {
      const t = data.techSkillWeight ?? 0.4;
      const w = data.workEthicWeight ?? 0.3;
      const c = data.commWeight ?? 0.15;
      const p = data.probSolvingWeight ?? 0.15;
      return Math.abs(t + w + c + p - 1) < 0.001;
    },
    { message: 'Weights must sum to 1.00' }
  );

export const departmentSchema = z.object({
  name: z.string().min(1),
  faculty: z.string().min(1),
  hodAdminId: z.string().optional().nullable(),
});

export const sessionSchema = z.object({
  name: z.string().min(1),
  startDate: z.string(),
  endDate: z.string(),
});

export const assignmentSchema = z.object({
  studentId: z.string().min(1),
  supervisorId: z.string().min(1),
});

export const reassignSchema = z.object({
  newSupervisorId: z.string().min(1),
});

export const siteVisitSchema = z.object({
  company: z.string().min(1),
  address: z.string().optional().default(''),
  visitDate: z.string(),
  notes: z.string().optional().default(''),
  studentIds: z.array(z.string()).optional().default([]),
});

export const broadcastSchema = z.object({
  role: z.enum(['admin', 'supervisor', 'student']).optional(),
  title: z.string().min(1),
  body: z.string().min(1),
});
