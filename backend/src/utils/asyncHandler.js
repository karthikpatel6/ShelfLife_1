/**
 * asyncHandler - Wraps async route handlers to eliminate try/catch boilerplate.
 * Passes any rejected promise or thrown error to Express's next() error handler.
 *
 * Usage:
 *   router.get('/route', asyncHandler(async (req, res) => { ... }));
 *
 * @param {Function} fn - Async express handler (req, res, next) => Promise
 * @returns {Function} - Express middleware that catches async errors
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
