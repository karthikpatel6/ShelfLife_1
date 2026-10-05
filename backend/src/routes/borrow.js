import { Router } from 'express';
import { borrowBook, returnBook } from '../controllers/borrowController.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  borrowBookSchema,
  borrowIdParamSchema,
} from '../validators/borrowValidator.js';

const router = Router();

/**
 * POST /api/borrow  - PROTECTED
 * Issue a book to a member. Uses atomic conditional update to prevent race conditions.
 */
router.post('/', protect, validate({ body: borrowBookSchema }), borrowBook);

/**
 * POST /api/return/:borrowId  - PROTECTED
 * Return a borrowed book. Rejects if already returned (409).
 */
router.post(
  '/:borrowId',
  protect,
  validate({ params: borrowIdParamSchema }),
  returnBook
);

export default router;
