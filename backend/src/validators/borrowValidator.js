import { z } from 'zod';

/**
 * Zod schema for issuing a book (POST /api/borrow).
 */
export const borrowBookSchema = z.object({
  bookId: z
    .string()
    .regex(/^[a-f\d]{24}$/i, 'Invalid bookId (must be a 24-char MongoDB ObjectId'),
  memberId: z
    .string()
    .regex(/^[a-f\d]{24}$/i, 'Invalid memberId (must be a 24-char MongoDB ObjectId'),
});

/**
 * Zod schema for validating the borrowId route param (POST /api/return/:borrowId).
 */
export const borrowIdParamSchema = z.object({
  borrowId: z
    .string()
    .regex(/^[a-f\d]{24}$/i, 'Invalid borrowId (must be a 24-char MongoDB ObjectId'),
});
