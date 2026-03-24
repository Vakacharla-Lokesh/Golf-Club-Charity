import { z } from 'zod';
import { DRAW_CONFIG, CHARITY_CONFIG } from './constants';

// Authentication Schemas
export const SignupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  fullName: z.string().optional(),
});

export const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

// Golf Score Schemas
export const ScoreSchema = z.object({
  score: z
    .number()
    .int('Score must be a whole number')
    .min(DRAW_CONFIG.MIN_SCORE, `Minimum score is ${DRAW_CONFIG.MIN_SCORE}`)
    .max(DRAW_CONFIG.MAX_SCORE, `Maximum score is ${DRAW_CONFIG.MAX_SCORE}`),
  playedAt: z.string().datetime('Invalid date format'),
});

export const ScoreListSchema = z.object({
  scores: z.array(ScoreSchema),
});

// Profile Update Schemas
export const ProfileUpdateSchema = z.object({
  fullName: z.string().optional(),
  charityId: z.string().uuid('Invalid charity ID').optional(),
  charityPercentage: z
    .number()
    .int('Percentage must be a whole number')
    .min(CHARITY_CONFIG.MIN_PERCENTAGE)
    .max(CHARITY_CONFIG.MAX_PERCENTAGE)
    .optional(),
});

// Charity Schemas
export const CharitySchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  image_url: z.string().url().nullable(),
  is_featured: z.boolean(),
  is_active: z.boolean(),
});

// Stripe Schemas
export const CheckoutSessionSchema = z.object({
  plan: z.enum(['monthly', 'yearly']),
  charityId: z.string().uuid().optional(),
});

// Admin Draw Schemas
export const DrawSimulateSchema = z.object({
  drawType: z.enum(['random', 'algorithmic']),
});

export const DrawPublishSchema = z.object({
  drawDate: z.string().datetime('Invalid date format'),
  drawType: z.enum(['random', 'algorithmic']),
});

// Type exports for runtime validation
export type SignupInput = z.infer<typeof SignupSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type ScoreInput = z.infer<typeof ScoreSchema>;
export type ProfileUpdateInput = z.infer<typeof ProfileUpdateSchema>;
export type CheckoutSessionInput = z.infer<typeof CheckoutSessionSchema>;
export type DrawSimulateInput = z.infer<typeof DrawSimulateSchema>;
export type DrawPublishInput = z.infer<typeof DrawPublishSchema>;
