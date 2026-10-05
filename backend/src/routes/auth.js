import { Router } from 'express';
import { login } from '../controllers/authController.js';
import { validate } from '../middleware/validate.js';
import { loginSchema } from '../validators/authValidator.js';

const router = Router();

/**
 * POST /api/auth/login
 * Authenticate a librarian. Returns a JWT token on success.
 */
router.post('/login', validate({ body: loginSchema }), login);

export default router;
