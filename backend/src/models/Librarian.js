import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

/**
 * Librarian Schema
 * - passwordHash stores the bcrypt-hashed password (never the plain-text).
 * - comparePassword is an instance method for authentication.
 */
const librarianSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: [true, 'Password is required'],
      select: false, // never returned in queries by default
    },
  },
  { timestamps: true }
);

/**
 * Hash the password before saving if it has been modified.
 * Using bcrypt with salt rounds = 12 for strong security.
 */
librarianSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash')) return next();
  this.passwordHash = await bcrypt.hash(this.passwordHash, 12);
  next();
});

/**
 * Instance method to verify a candidate password against the stored hash.
 * @param {string} candidatePassword - Plain-text password from login request
 * @returns {Promise<boolean>}
 */
librarianSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

export const Librarian = mongoose.model('Librarian', librarianSchema);
