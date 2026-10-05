import mongoose from 'mongoose';

/**
 * BorrowRecord Schema
 * - dueDate defaults to issueDate + 14 days (computed via pre-save hook).
 * - status is an enum: 'issued' | 'returned' | 'overdue'.
 * - Compound index on { member, issueDate: -1 } for efficient member history queries.
 *
 * OVERDUE LOGIC APPROACH:
 * We store 'status' in the DB as 'issued' or 'returned'. When records are READ
 * (in the member history controller), we compute isOverdue dynamically:
 *   isOverdue = (status === 'issued' && dueDate < now)
 * We do NOT update status to 'overdue' on return (it stays 'issued' until returned).
 * This avoids expensive background jobs and keeps the DB simple.
 * The 'overdue' enum value is reserved for when a background job explicitly marks it.
 * The isOverdue flag is computed on each read and sent to the client.
 */
const borrowRecordSchema = new mongoose.Schema(
  {
    book: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Book',
      required: [true, 'Book reference is required'],
      index: true,
    },
    member: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Member',
      required: [true, 'Member reference is required'],
      index: true,
    },
    issueDate: {
      type: Date,
      default: Date.now,
    },
    dueDate: {
      type: Date,
      required: [true, 'Due date is required'],
    },
    returnDate: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ['issued', 'returned', 'overdue'],
      default: 'issued',
    },
  },
  { timestamps: true }
);

// Set dueDate = issueDate + 14 days if not provided
borrowRecordSchema.pre('save', function (next) {
  if (!this.dueDate) {
    const issue = this.issueDate || new Date();
    this.dueDate = new Date(issue.getTime() + 14 * 24 * 60 * 60 * 1000);
  }
  next();
});

// Compound index: efficiently query a member's history sorted by newest first
borrowRecordSchema.index({ member: 1, issueDate: -1 });

export const BorrowRecord = mongoose.model('BorrowRecord', borrowRecordSchema);
