import { Member } from '../models/Member.js';
import { BorrowRecord } from '../models/BorrowRecord.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

/**
 * POST /api/members  [PROTECTED]
 * Registers a new library member.
 *
 * Body: { name, email, membershipId, joinedDate? }
 * Response: 201 { success, data: Member }
 */
export const createMember = asyncHandler(async (req, res) => {
  const member = await Member.create(req.body);
  res.status(201).json({ success: true, data: member });
});

/**
 * GET /api/members/:id/history  [PROTECTED]
 * Returns the full borrow history for a given member, sorted newest first.
 * Each record includes:
 *   - Populated book details (title, author, genre, isbn)
 *   - isOverdue: computed dynamically (not stored in DB)
 *     A record is overdue if status === 'issued' and dueDate < now.
 *
 * OVERDUE LOGIC:
 * We do NOT update the DB status field to 'overdue' as that would require
 * a background job. Instead, we compute isOverdue at read time. This is safe
 * because availability decisions (borrow/return) do not depend on the overdue flag.
 *
 * Route param: :id (member ObjectId)
 * Response: { success, data: BorrowRecord[] (with isOverdue, book populated) }
 */
export const getMemberHistory = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Verify member exists
  const member = await Member.findById(id);
  if (!member) {
    throw new AppError('Member not found', 404);
  }

  // Fetch borrow records sorted newest first (uses compound index)
  const records = await BorrowRecord.find({ member: id })
    .sort({ issueDate: -1 })
    .populate('book', 'title author isbn genre availableCopies')
    .populate('member', 'name email membershipId')
    .lean(); // lean() returns plain objects for mutation

  const now = new Date();

  // Map records to include computed isOverdue flag
  const data = records.map((record) => ({
    ...record,
    isOverdue: record.status === 'issued' && record.dueDate < now,
  }));

  res.status(200).json({ success: true, member, data });
});
