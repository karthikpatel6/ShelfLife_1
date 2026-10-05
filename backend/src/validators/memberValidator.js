import { z } from 'zod';

/**
 * Zod schema for creating a new member.
 */
export const createMemberSchema = z.object({
  name: z.string().min(1, 'Name is required').trim(),
  email: z
    .string()
    .email('Invalid email format')
    .toLowerCase()
    .trim(),
  membershipId: z
    .string()
    .min(3, 'Membership ID must be at least 3 characters')
    .trim(),
  joinedDate: z.coerce.date().optional(),
});

/**
 * Zod schema for validating a MongoDB ObjectId in route params.
 */
export const objectIdParamSchema = z.object({
  id: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid member ID'),
});
