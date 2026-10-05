import { Book } from '../models/Book.js';
import { Member } from '../models/Member.js';
import { BorrowRecord } from '../models/BorrowRecord.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

/**
 * POST /api/borrow  [PROTECTED]
 * Issues a book to a member using an ATOMIC operation to prevent race conditions.
 *
 * ============================================================
 * RACE CONDITION PREVENTION (read carefully):
 *
 * UNSAFE approach (read-then-write):
 *   const book = await Book.findById(id);      // READ
 *   if (book.availableCopies > 0) {
 *     book.availableCopies--;                  // WRITE
 *     await book.save();
 *   }
 * Problem: Between the READ and WRITE, another concurrent request can also
 * read availableCopies > 0 and both proceed to decrement, resulting in
 * -1 available copies (data corruption).
 *
 * SAFE approach (used here) - atomic conditional update:
 *   Book.findOneAndUpdate(
 *     { _id: bookId, availableCopies: { $gt: 0 } },
 *     { $inc: { availableCopies: -1 } },
 *     { new: true }
 *   )
 * MongoDB executes the filter + update as a single atomic document-level
 * operation. Only one concurrent request will match the filter when copies = 1.
 * All others get null back and receive a 409. No lock tables, no transactions needed.
 *
 * Alternatives considered:
 * - MongoDB transactions (replica set required) — more correct but adds infra overhead.
 * - Optimistic locking (version key) — requires application-level retries.
 * - Pessimistic locking — no native support in MongoDB without external tools.
 * ============================================================
 *
 * Body: { bookId, memberId }
 * Response: 201 { success, data: BorrowRecord (populated) }
 */
export const borrowBook = asyncHandler(async (req, res) => {
  const { bookId, memberId } = req.body;

  // 1. Verify member exists
  const member = await Member.findById(memberId);
  if (!member) {
    throw new AppError('Member not found', 404);
  }

  // 2. OPTIONAL: Prevent the same member from borrowing the same book twice concurrently
  const existingBorrow = await BorrowRecord.findOne({
    book: bookId,
    member: memberId,
    status: 'issued',
  });
  if (existingBorrow) {
    throw new AppError(
      'This member already has an active borrow of this book',
      409
    );
  }

  // 3. ATOMIC: Decrement availableCopies only if > 0 (prevents race conditions)
  const book = await Book.findOneAndUpdate(
    { _id: bookId, availableCopies: { $gt: 0 } }, // filter: book exists AND has copies
    { $inc: { availableCopies: -1 } },              // atomic decrement
    { new: true }                                   // return updated document
  );

  // If book is null: either book not found OR no copies left
  if (!book) {
    // Distinguish between "book doesn't exist" and "no copies"
    const bookExists = await Book.exists({ _id: bookId });
    if (!bookExists) throw new AppError('Book not found', 404);
    throw new AppError('No copies available. All copies are currently issued.', 409);
  }

  // 4. Create the BorrowRecord (dueDate auto-set to issueDate + 14 days via pre-save)
  let borrowRecord;
  try {
    borrowRecord = await BorrowRecord.create({ book: bookId, member: memberId });
  } catch (createError) {
    // ROLLBACK: If record creation fails, undo the availableCopies decrement
    await Book.findByIdAndUpdate(bookId, { $inc: { availableCopies: 1 } });
    throw createError;
  }

  // 5. Populate and return the record
  const populated = await borrowRecord.populate([
    { path: 'book', select: 'title author isbn genre availableCopies totalCopies' },
    { path: 'member', select: 'name email membershipId' },
  ]);

  res.status(201).json({ success: true, data: populated });
});

/**
 * POST /api/return/:borrowId  [PROTECTED]
 * Returns a borrowed book.
 * - Sets returnDate to now.
 * - Sets status to 'returned'.
 * - Atomically increments availableCopies on the Book.
 * - Rejects with 409 if the record is already returned.
 *
 * Param: borrowId (BorrowRecord ObjectId)
 * Response: { success, data: BorrowRecord (populated) }
 */
export const returnBook = asyncHandler(async (req, res) => {
  const { borrowId } = req.params;

  // 1. Find the borrow record
  const record = await BorrowRecord.findById(borrowId);
  if (!record) {
    throw new AppError('Borrow record not found', 404);
  }

  // 2. Reject if already returned (idempotency guard)
  if (record.status === 'returned') {
    throw new AppError('This book has already been returned', 409);
  }

  // 3. Update the borrow record
  record.returnDate = new Date();
  record.status = 'returned';
  await record.save();

  // 4. Atomically increment availableCopies on the book
  await Book.findByIdAndUpdate(record.book, { $inc: { availableCopies: 1 } });

  // 5. Populate and respond
  const populated = await record.populate([
    { path: 'book', select: 'title author isbn genre availableCopies totalCopies' },
    { path: 'member', select: 'name email membershipId' },
  ]);

  res.status(200).json({ success: true, data: populated });
});
