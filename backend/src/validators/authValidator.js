import { z } from 'zod';

/**
 * Zod schema for POST /api/auth/login.
 */
export const loginSchema = z.object({
  email: z.string().email('Invalid email format').toLowerCase().trim(),
  password: z.string().min(1, 'Password is required'),
});
