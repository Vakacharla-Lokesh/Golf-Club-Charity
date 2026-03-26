import { z } from 'zod';
import {
  GOLF_SCORE_MIN,
  GOLF_SCORE_MAX,
  CHARITY_PERCENTAGE_MIN,
  CHARITY_PERCENTAGE_MAX,
  CHARITY_PERCENTAGE_STEP,
} from './constants';

/**
 * Auth validation schemas
 */
export const signupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  fullName: z.string().min(1, 'Name is required').max(100, 'Name too long'),
});

export type SignupInput = z.infer<typeof signupSchema>;

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export type LoginInput = z.infer<typeof loginSchema>;

/**
 * Score validation schemas
 */
export const scoreSchema = z.object({
  score: z
    .number()
    .int('Score must be a whole number')
    .min(GOLF_SCORE_MIN, `Score must be at least ${GOLF_SCORE_MIN}`)
    .max(GOLF_SCORE_MAX, `Score must be at most ${GOLF_SCORE_MAX}`),
  playedAt: z
    .string()
    .datetime('Invalid date format')
    .refine((date) => new Date(date) <= new Date(), {
      message: 'Score date cannot be in the future',
    }),
});

export type ScoreInput = z.infer<typeof scoreSchema>;

/**
 * Profile update validation
 */
export const profileUpdateSchema = z.object({
  fullName: z.string().min(1).max(100).optional(),
  charityId: z.string().uuid().nullable().optional(),
  charityPercentage: z
    .number()
    .int()
    .min(CHARITY_PERCENTAGE_MIN, `Minimum charity % is ${CHARITY_PERCENTAGE_MIN}`)
    .max(CHARITY_PERCENTAGE_MAX, `Maximum charity % is ${CHARITY_PERCENTAGE_MAX}`)
    .refine(
      (value) => value % CHARITY_PERCENTAGE_STEP === 0,
      `Charity % must increase in steps of ${CHARITY_PERCENTAGE_STEP}`
    )
    .optional(),
});

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;

/**
 * Stripe checkout validation
 */
export const checkoutSchema = z.object({
  priceId: z.string().refine(
    (id) => id.startsWith('price_'),
    'Invalid price ID'
  ),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;

/**
 * Draw validation schemas
 */
export const drawSimulationSchema = z.object({
  drawType: z.enum(['random', 'algorithmic']),
  drawDate: z.string().date(),
});

export type DrawSimulationInput = z.infer<typeof drawSimulationSchema>;

/**
 * Results validation
 */
export const resultUpdateSchema = z.object({
  paymentStatus: z.enum(['pending', 'paid', 'rejected']),
  proofUrl: z.string().url().optional().nullable(),
});

export type ResultUpdateInput = z.infer<typeof resultUpdateSchema>;
