import { Book } from '../models/Book.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

/**
 * POST /api/books  [PROTECTED]
 * Creates a new book.
 * If availableCopies is not provided, it defaults to totalCopies.
 *
 * Body: { title, author, isbn, genre, totalCopies, availableCopies? }
 * Response: 201 { success, data: Book }
 */
export const createBook = asyncHandler(async (req, res) => {
  const { title, author, isbn, genre, totalCopies, availableCopies } = req.body;

  // Default availableCopies to totalCopies if not explicitly given
  const copies = availableCopies !== undefined ? availableCopies : totalCopies;

  // Guard: availableCopies cannot exceed totalCopies
  if (copies > totalCopies) {
    throw new AppError('availableCopies cannot exceed totalCopies', 400);
  }

  const book = await Book.create({
    title,
    author,
    isbn,
    genre,
    totalCopies,
    availableCopies: copies,
  });

  res.status(201).json({ success: true, data: book });
});

/**
 * GET /api/books  [PUBLIC]
 * Returns a paginated list of books with optional filtering.
 *
 * Query: { page, limit, genre, search }
 * - search: case-insensitive regex on title (input is escaped for safety)
 * - genre: exact match filter
 * Response: { success, data, page, limit, total, totalPages }
 */
export const getBooks = asyncHandler(async (req, res) => {
  const { page, limit, genre, search } = req.query;

  const filter = {};

  // Genre exact match (case-insensitive via case-insensitive index)
  if (genre) {
    filter.genre = { $regex: new RegExp(`^${escapeRegex(genre)}$`, 'i') };
  }

  // Title search: escape special regex chars to prevent ReDoS attacks
  if (search) {
    filter.title = { $regex: new RegExp(escapeRegex(search), 'i') };
  }

  const skip = (page - 1) * limit;
  const [books, total] = await Promise.all([
    Book.find(filter).skip(skip).limit(limit).sort({ createdAt: -1 }),
    Book.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    data: books,
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  });
});

/**
 * Escapes special regex metacharacters to prevent ReDoS attacks.
 * @param {string} str - Raw user input
 * @returns {string} Escaped string safe for use in RegExp
 */
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
