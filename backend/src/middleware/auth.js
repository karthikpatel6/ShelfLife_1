import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { Librarian } from '../models/Librarian.js';

/**
 * protect middleware - Verifies JWT Bearer token and attaches req.user.
 *
 * Flow:
 * 1. Extract "Bearer <token>" from Authorization header.
 * 2. Verify the token with JWT_SECRET.
 * 3. Fetch the librarian from DB to ensure they still exist.
 * 4. Attach librarian object to req.user for downstream handlers.
 *
 * Returns 401 if token is missing, malformed, expired, or user not found.
 */
export const protect = asyncHandler(async (req, res, next) => {
  // 1. Get token from Authorization header
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AppError('Authentication required. Please provide a Bearer token.', 401);
  }

  const token = authHeader.split(' ')[1];

  // 2. Verify token (throws JsonWebTokenError or TokenExpiredError on failure)
  const decoded = jwt.verify(token, env.JWT_SECRET);

  // 3. Ensure the librarian still exists in DB
  const librarian = await Librarian.findById(decoded.id);
  if (!librarian) {
    throw new AppError('The librarian belonging to this token no longer exists.', 401);
  }

  // 4. Attach user to request for downstream use
  req.user = librarian;
  next();
});
