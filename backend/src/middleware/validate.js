import { AppError } from '../utils/AppError.js';

/**
 * validate - Middleware factory for Zod schema validation.
 * Validates req.body, req.params, and req.query against the provided Zod schemas.
 * Throws a ZodError (caught by errorHandler) on validation failure.
 *
 * Usage:
 *   router.post('/books', validate({ body: createBookSchema }), booksController.create);
 *
 * @param {{ body?: ZodSchema, params?: ZodSchema, query?: ZodSchema }} schemas
 * @returns Express middleware
 */
export const validate = (schemas) => (req, res, next) => {
  try {
    // Validate and coerce each section if a schema is provided
    if (schemas.body) {
      req.body = schemas.body.parse(req.body);
    }
    if (schemas.params) {
      req.params = schemas.params.parse(req.params);
    }
    if (schemas.query) {
      req.query = schemas.query.parse(req.query);
    }
    next();
  } catch (err) {
    // Pass ZodError to centralized error handler
    next(err);
  }
};
