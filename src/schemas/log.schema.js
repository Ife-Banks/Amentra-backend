import { z } from 'zod';

export const createLogSchema = z.object({
  date: z.string(),
  title: z.string().min(1),
  description: z.string().min(50, 'Description must be at least 50 characters'),
  hoursWorked: z.number().min(1).max(24),
  skillsLearned: z.array(z.string()).optional().default([]),
  challenges: z.string().optional().default(''),
});

export const updateLogSchema = createLogSchema.partial();

export const approveLogSchema = z.object({
  comment: z.string().optional(),
});

export const rejectLogSchema = z.object({
  comment: z.string().min(1, 'Comment is required when rejecting'),
});

export const rateLogSchema = z.object({
  rating: z.number().min(1).max(5),
});
