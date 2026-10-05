import { Router } from 'express';
import { createBook, getBooks } from '../controllers/booksController.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createBookSchema, getBooksQuerySchema } from '../validators/bookValidator.js';

const router = Router();

/**
 * GET /api/books  - PUBLIC
 * Supports ?page, ?limit, ?genre, ?search (title, case-insensitive)
 */
router.get('/', validate({ query: getBooksQuerySchema }), getBooks);

/**
 * POST /api/books  - PROTECTED
 * Create a new book entry.
 */
router.post('/', protect, validate({ body: createBookSchema }), createBook);

export default router;
