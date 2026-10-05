/**
 * AppError - Custom application error class.
 * Extends the native Error with an HTTP status code and a flag
 * to distinguish operational errors (user-facing) from programming bugs.
 *
 * Usage:
 *   throw new AppError('Book not found', 404);
 *   throw new AppError('No copies available', 409);
 */
export class AppError extends Error {
  /**
   * @param {string} message - Human-readable error message
   * @param {number} statusCode - HTTP status code (4xx or 5xx)
   */
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true; // marks as expected, not a bug

    // Capture the stack trace, excluding the constructor call itself
    Error.captureStackTrace(this, this.constructor);
  }
}
