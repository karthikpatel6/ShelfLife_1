import { Router } from 'express';
import { createMember, getMemberHistory } from '../controllers/membersController.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createMemberSchema, objectIdParamSchema } from '../validators/memberValidator.js';

const router = Router();

/**
 * POST /api/members  - PROTECTED
 * Register a new library member.
 */
router.post('/', protect, validate({ body: createMemberSchema }), createMember);

/**
 * GET /api/members/:id/history  - PROTECTED
 * Full borrow history for a member, sorted newest first.
 * Includes computed isOverdue flag per record.
 */
router.get(
  '/:id/history',
  protect,
  validate({ params: objectIdParamSchema }),
  getMemberHistory
);

export default router;
