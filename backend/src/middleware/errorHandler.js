import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';

/**
 * Handles Mongoose CastError (invalid ObjectId in params).
 * Returns a 400 with a clear message.
 */
const handleCastError = (err) =>
  new AppError(`Invalid ${err.path}: ${err.value}`, 400);

/**
 * Handles MongoDB duplicate key error (code 11000).
 * Extracts the duplicate field name for a user-friendly message.
 * Returns 409 Conflict.
 */
const handleDuplicateKeyError = (err) => {
  const field = Object.keys(err.keyValue || {})[0] || 'field';
  const value = err.keyValue?.[field];
  return new AppError(`Duplicate ${field}: "${value}" already exists`, 409);
};

/**
 * Handles Mongoose ValidationError (schema-level validators failed).
 * Collects all validation messages into a single 422 response.
 */
const handleValidationError = (err) => {
  const errors = Object.values(err.errors).map((e) => e.message);
  return new AppError(`Validation failed: ${errors.join('. ')}`, 422);
};

/**
 * Handles Zod validation errors.
 * Maps ZodError issues into a readable errors array.
 */
const handleZodError = (err) => {
  const errors = err.errors.map((e) => ({
    field: e.path.join('.'),
    message: e.message,
  }));
  return { statusCode: 422, message: 'Validation error', errors };
};

/**
 * Handles JWT errors:
 * - JsonWebTokenError: malformed or invalid token -> 401
 * - TokenExpiredError: expired token -> 401
 */
const handleJWTError = () =>
  new AppError('Invalid or expired token. Please log in again.', 401);

/**
 * Centralized error handler middleware.
 * Must be registered LAST in the Express middleware chain.
 * Differentiates between operational errors (AppError) and unexpected bugs.
 * Hides internal stack traces in production.
 *
 * Consistent JSON error shape:
 *   { success: false, message: string, errors?: [...] }
 */
export const errorHandler = (err, req, res, next) => {
  // Default to 500 Internal Server Error
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let errors = undefined;

  // --- Transform known error types ---

  // Mongoose CastError (bad ObjectId)
  if (err.name === 'CastError') {
    const appErr = handleCastError(err);
    statusCode = appErr.statusCode;
    message = appErr.message;
  }

  // MongoDB duplicate key
  else if (err.code === 11000) {
    const appErr = handleDuplicateKeyError(err);
    statusCode = appErr.statusCode;
    message = appErr.message;
  }

  // Mongoose ValidationError
  else if (err.name === 'ValidationError') {
    const appErr = handleValidationError(err);
    statusCode = appErr.statusCode;
    message = appErr.message;
  }

  // Zod validation error
  else if (err.name === 'ZodError') {
    const zodResult = handleZodError(err);
    statusCode = zodResult.statusCode;
    message = zodResult.message;
    errors = zodResult.errors;
  }

  // JWT errors
  else if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    const appErr = handleJWTError();
    statusCode = appErr.statusCode;
    message = appErr.message;
  }

  // Log unexpected (non-operational) errors for debugging
  if (!err.isOperational && err.name !== 'ZodError') {
    console.error('[ERROR]', err);
  }

  // Build response (hide stack in production)
  const response = {
    success: false,
    message,
    ...(errors && { errors }),
    ...(env.NODE_ENV === 'development' && !err.isOperational && { stack: err.stack }),
  };

  res.status(statusCode).json(response);
};
