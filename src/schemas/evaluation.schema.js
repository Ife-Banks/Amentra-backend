import { z } from 'zod';

const scoreSchema = z.number().min(0).max(100);

export const createEvaluationSchema = z.object({
  studentId: z.string().min(1),
  sessionId: z.string().min(1),
  type: z.enum(['midterm', 'final']),
  technicalSkillScore: scoreSchema,
  workEthicScore: scoreSchema,
  communicationScore: scoreSchema,
  problemSolvingScore: scoreSchema,
  remarks: z.string().optional().default(''),
});

export const updateEvaluationSchema = createEvaluationSchema.partial();
