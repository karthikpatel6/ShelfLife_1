import { z } from 'zod';

/**
 * Zod schema for creating a new book.
 * availableCopies is optional (defaults to totalCopies in controller).
 */
export const createBookSchema = z.object({
  title: z.string().min(1, 'Title is required').trim(),
  author: z.string().min(1, 'Author is required').trim(),
  isbn: z
    .string()
    .min(10, 'ISBN must be at least 10 characters')
    .max(17, 'ISBN too long')
    .trim(),
  genre: z.string().min(1, 'Genre is required').trim(),
  totalCopies: z
    .number({ invalid_type_error: 'totalCopies must be a number' })
    .int('totalCopies must be an integer')
    .min(1, 'At least 1 copy required'),
  availableCopies: z
    .number()
    .int()
    .min(0, 'Available copies cannot be negative')
    .optional(),
});

/**
 * Zod schema for GET /api/books query parameters.
 * All fields are optional; coerce strings to numbers for pagination.
 */
export const getBooksQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(10),
  genre: z.string().trim().optional(),
  search: z.string().trim().optional(),
});
