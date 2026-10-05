/**
 * Seed Script - Populates the database with:
 * - 1 default librarian (librarian@shelflife.com / Admin@123)
 * - 15 books across 5 genres
 * - 5 members
 * - 8 borrow records (including 2 overdue ones)
 *
 * Usage: npm run seed
 * WARNING: This script CLEARS existing data before seeding.
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { Book } from '../models/Book.js';
import { Member } from '../models/Member.js';
import { BorrowRecord } from '../models/BorrowRecord.js';
import { Librarian } from '../models/Librarian.js';

const books = [
  // Fiction (4 books)
  { title: 'The Great Gatsby', author: 'F. Scott Fitzgerald', isbn: '9780743273565', genre: 'Fiction', totalCopies: 5, availableCopies: 3 },
  { title: 'To Kill a Mockingbird', author: 'Harper Lee', isbn: '9780061935466', genre: 'Fiction', totalCopies: 4, availableCopies: 2 },
  { title: '1984', author: 'George Orwell', isbn: '9780451524935', genre: 'Fiction', totalCopies: 6, availableCopies: 1 },
  { title: 'Pride and Prejudice', author: 'Jane Austen', isbn: '9780141439518', genre: 'Fiction', totalCopies: 3, availableCopies: 3 },

  // Computer Science (4 books)
  { title: 'Clean Code', author: 'Robert C. Martin', isbn: '9780132350884', genre: 'Computer Science', totalCopies: 4, availableCopies: 2 },
  { title: 'The Pragmatic Programmer', author: 'David Thomas & Andrew Hunt', isbn: '9780135957059', genre: 'Computer Science', totalCopies: 3, availableCopies: 1 },
  { title: 'Design Patterns', author: 'Gang of Four', isbn: '9780201633610', genre: 'Computer Science', totalCopies: 2, availableCopies: 0 },
  { title: 'Introduction to Algorithms', author: 'Cormen et al.', isbn: '9780262033848', genre: 'Computer Science', totalCopies: 5, availableCopies: 4 },

  // History (3 books)
  { title: 'Sapiens: A Brief History', author: 'Yuval Noah Harari', isbn: '9780062316097', genre: 'History', totalCopies: 5, availableCopies: 3 },
  { title: 'Guns, Germs, and Steel', author: 'Jared Diamond', isbn: '9780393317558', genre: 'History', totalCopies: 3, availableCopies: 2 },
  { title: 'The History of the Ancient World', author: 'Susan Wise Bauer', isbn: '9780393059748', genre: 'History', totalCopies: 2, availableCopies: 2 },

  // Science (2 books)
  { title: 'A Brief History of Time', author: 'Stephen Hawking', isbn: '9780553380163', genre: 'Science', totalCopies: 4, availableCopies: 2 },
  { title: 'The Selfish Gene', author: 'Richard Dawkins', isbn: '9780198788607', genre: 'Science', totalCopies: 3, availableCopies: 3 },

  // Philosophy (2 books)
  { title: 'Meditations', author: 'Marcus Aurelius', isbn: '9780140449334', genre: 'Philosophy', totalCopies: 4, availableCopies: 4 },
  { title: 'The Republic', author: 'Plato', isbn: '9780140455113', genre: 'Philosophy', totalCopies: 3, availableCopies: 2 },
];

const members = [
  { name: 'Alice Johnson', email: 'alice@example.com', membershipId: 'MEM001' },
  { name: 'Bob Smith', email: 'bob@example.com', membershipId: 'MEM002' },
  { name: 'Carol White', email: 'carol@example.com', membershipId: 'MEM003' },
  { name: 'David Brown', email: 'david@example.com', membershipId: 'MEM004' },
  { name: 'Eve Davis', email: 'eve@example.com', membershipId: 'MEM005' },
];

async function seed() {
  try {
    await mongoose.connect(env.MONGO_URI);
    console.log('[SEED] Connected to MongoDB');

    // Clear existing data
    await Promise.all([
      Book.deleteMany({}),
      Member.deleteMany({}),
      BorrowRecord.deleteMany({}),
      Librarian.deleteMany({}),
    ]);
    console.log('[SEED] Cleared existing data');

    // 1. Create librarian
    const librarian = await Librarian.create({
      name: 'Admin Librarian',
      email: 'librarian@shelflife.com',
      passwordHash: 'Admin@123', // pre-save hook will hash this
    });
    console.log('[SEED] Librarian created: librarian@shelflife.com / Admin@123');

    // 2. Create books
    const createdBooks = await Book.insertMany(books);
    console.log(`[SEED] ${createdBooks.length} books created`);

    // 3. Create members
    const createdMembers = await Member.insertMany(members);
    console.log(`[SEED] ${createdMembers.length} members created`);

    // 4. Create borrow records
    const now = new Date();
    const daysAgo = (n) => new Date(now.getTime() - n * 24 * 60 * 60 * 1000);

    const borrowRecords = [
      // Active (issued) records
      {
        book: createdBooks[0]._id, // The Great Gatsby
        member: createdMembers[0]._id, // Alice
        issueDate: daysAgo(5),
        dueDate: new Date(daysAgo(5).getTime() + 14 * 24 * 60 * 60 * 1000),
        status: 'issued',
      },
      {
        book: createdBooks[4]._id, // Clean Code
        member: createdMembers[1]._id, // Bob
        issueDate: daysAgo(3),
        dueDate: new Date(daysAgo(3).getTime() + 14 * 24 * 60 * 60 * 1000),
        status: 'issued',
      },
      // Returned records
      {
        book: createdBooks[8]._id, // Sapiens
        member: createdMembers[0]._id, // Alice
        issueDate: daysAgo(30),
        dueDate: daysAgo(16),
        returnDate: daysAgo(14),
        status: 'returned',
      },
      {
        book: createdBooks[11]._id, // A Brief History of Time
        member: createdMembers[2]._id, // Carol
        issueDate: daysAgo(20),
        dueDate: daysAgo(6),
        returnDate: daysAgo(5),
        status: 'returned',
      },
      // OVERDUE records (issued but dueDate has passed)
      {
        book: createdBooks[2]._id, // 1984
        member: createdMembers[3]._id, // David
        issueDate: daysAgo(30),
        dueDate: daysAgo(16), // 16 days ago — clearly overdue
        returnDate: null,
        status: 'issued', // still 'issued'; isOverdue computed at read time
      },
      {
        book: createdBooks[5]._id, // The Pragmatic Programmer
        member: createdMembers[4]._id, // Eve
        issueDate: daysAgo(25),
        dueDate: daysAgo(11), // 11 days ago — overdue
        returnDate: null,
        status: 'issued', // still 'issued'; isOverdue computed at read time
      },
      // More records for variety
      {
        book: createdBooks[1]._id, // To Kill a Mockingbird
        member: createdMembers[2]._id, // Carol
        issueDate: daysAgo(7),
        dueDate: new Date(daysAgo(7).getTime() + 14 * 24 * 60 * 60 * 1000),
        status: 'issued',
      },
      {
        book: createdBooks[13]._id, // Meditations
        member: createdMembers[1]._id, // Bob
        issueDate: daysAgo(10),
        dueDate: daysAgo(10 - 14), // future due date
        returnDate: daysAgo(2),
        status: 'returned',
      },
    ];

    await BorrowRecord.insertMany(borrowRecords);
    console.log(`[SEED] ${borrowRecords.length} borrow records created (including 2 overdue)`);

    console.log('\n[SEED] ✅ Database seeded successfully!');
    console.log('─────────────────────────────────────────');
    console.log('Librarian: librarian@shelflife.com');
    console.log('Password : Admin@123');
    console.log('─────────────────────────────────────────');
    console.log(`Books    : ${createdBooks.length}`);
    console.log(`Members  : ${createdMembers.length}`);
    console.log(`Records  : ${borrowRecords.length} (2 overdue: David + Eve)`);
  } catch (err) {
    console.error('[SEED] Error:', err.message);
  } finally {
    await mongoose.disconnect();
    console.log('[SEED] Disconnected from MongoDB');
  }
}

seed();
