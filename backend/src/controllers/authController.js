import jwt from 'jsonwebtoken';
import { Librarian } from '../models/Librarian.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { env } from '../config/env.js';

/**
 * Generates a signed JWT for the given librarian.
 * Token expires per JWT_EXPIRES_IN env var (default: 8h).
 *
 * @param {string} id - Librarian MongoDB ObjectId
 * @returns {string} JWT token
 */
const signToken = (id) =>
  jwt.sign({ id }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });

/**
 * POST /api/auth/login
 * Authenticates a librarian and returns a JWT token.
 *
 * Body: { email, password }
 * Response: { success, token, librarian: { id, name, email } }
 */
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // 1. Find librarian by email; explicitly select passwordHash (excluded by default)
  const librarian = await Librarian.findOne({ email }).select('+passwordHash');
  if (!librarian) {
    throw new AppError('Invalid email or password', 401);
  }

  // 2. Verify password against bcrypt hash
  const isMatch = await librarian.comparePassword(password);
  if (!isMatch) {
    throw new AppError('Invalid email or password', 401);
  }

  // 3. Generate JWT
  const token = signToken(librarian._id.toString());

  // 4. Respond (never send the passwordHash to the client)
  res.status(200).json({
    success: true,
    token,
    librarian: {
      id: librarian._id,
      name: librarian.name,
      email: librarian.email,
    },
  });
});
