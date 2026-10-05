import mongoose from 'mongoose';

/**
 * Book Schema
 * - isbn must match a valid ISBN-10 or ISBN-13 format (digits, optional hyphens).
 * - availableCopies cannot exceed totalCopies (enforced via validator).
 * - genre is indexed for filtering queries.
 */
const bookSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Book title is required'],
      trim: true,
    },
    author: {
      type: String,
      required: [true, 'Author is required'],
      trim: true,
    },
    isbn: {
      type: String,
      required: [true, 'ISBN is required'],
      unique: true,
      trim: true,
      validate: {
        // Accepts ISBN-10 and ISBN-13 with optional hyphens
        validator: (v) => /^(?:\d[- ]?){9}[\dXx]$|^(?:\d[- ]?){13}$/.test(v.replace(/[-\s]/g, '').length === 10 ? v : v),
        message: 'Invalid ISBN format. Must be ISBN-10 or ISBN-13.',
      },
    },
    genre: {
      type: String,
      required: [true, 'Genre is required'],
      trim: true,
      index: true, // indexed for genre-based filtering
    },
    totalCopies: {
      type: Number,
      required: [true, 'Total copies is required'],
      min: [1, 'Total copies must be at least 1'],
      validate: {
        validator: Number.isInteger,
        message: 'Total copies must be an integer',
      },
    },
    availableCopies: {
      type: Number,
      min: [0, 'Available copies cannot be negative'],
      validate: [
        {
          validator: Number.isInteger,
          message: 'Available copies must be an integer',
        },
        {
          // availableCopies must never exceed totalCopies
          validator: function (v) {
            return v <= this.totalCopies;
          },
          message: 'Available copies cannot exceed total copies',
        },
      ],
    },
  },
  { timestamps: true }
);

// Set availableCopies = totalCopies if not provided (handled in controller too)
bookSchema.pre('save', function (next) {
  if (this.availableCopies === undefined || this.availableCopies === null) {
    this.availableCopies = this.totalCopies;
  }
  next();
});

export const Book = mongoose.model('Book', bookSchema);
