# ShelfLife Backend API

Node.js + Express + Mongoose + JWT + Zod Library Management Platform API.

## Setup & Running Instructions

### Prerequisites
- Node.js (v18+)
- MongoDB running locally on `mongodb://localhost:27017/shelflife` (or set `MONGO_URI` in `.env`)

### Installation & Execution
```bash
# 1. Install dependencies
npm install

# 2. Configure Environment Variables
cp .env.example .env

# 3. Seed Database with initial data
npm run seed

# 4. Start Development Server
npm run dev

# 5. Run Concurrent Borrow Race Condition Test
npm run race-test
```

## Default Credentials
- **Librarian Email**: `librarian@shelflife.com`
- **Librarian Password**: `Admin@123`

---

## API Endpoints Reference

| Method | Endpoint | Auth Required | Request Body / Query | Success Response Code & Shape |
|---|---|---|---|---|
| `GET` | `/health` | No | None | `200 { success: true, message: string }` |
| `POST` | `/api/auth/login` | No | `{ email, password }` | `200 { success: true, token, librarian }` |
| `GET` | `/api/books` | No (Public) | Query: `?page=1&limit=10&genre=Fiction&search=Gatsby` | `200 { success: true, data: Book[], page, limit, total, totalPages }` |
| `POST` | `/api/books` | **Yes (JWT)** | `{ title, author, isbn, genre, totalCopies, availableCopies? }` | `201 { success: true, data: Book }` |
| `POST` | `/api/members` | **Yes (JWT)** | `{ name, email, membershipId, joinedDate? }` | `201 { success: true, data: Member }` |
| `POST` | `/api/borrow` | **Yes (JWT)** | `{ bookId, memberId }` | `201 { success: true, data: BorrowRecord }` |
| `POST` | `/api/return/:borrowId` | **Yes (JWT)** | URL Param: `borrowId` | `200 { success: true, data: BorrowRecord }` |
| `GET` | `/api/members/:id/history` | **Yes (JWT)** | URL Param: `id` (memberId) | `200 { success: true, member, data: BorrowRecord[] }` |

---

## Error Handling Format
All errors return a consistent JSON shape:
```json
{
  "success": false,
  "message": "Human readable error description",
  "errors": [
    { "field": "email", "message": "Invalid email format" }
  ]
}
```

HTTP Status Codes used:
- `201 Created`: Resource successfully created
- `400 Bad Request`: Schema validation error / invalid ObjectId
- `401 Unauthorized`: Missing or invalid JWT Bearer token
- `404 Not Found`: Resource not found
- `409 Conflict`: Duplicate entry (ISBN/email) or no available copies / already returned
- `422 Unprocessable Entity`: Zod or Mongoose validation failures
- `500 Internal Server Error`: Unexpected server error

---

## Technical Deep-Dives

### 1. Race Condition Prevention ($inc Atomic Conditional Update)
In high-concurrency environments, a traditional **read-then-write** pattern (`if (book.availableCopies > 0) { book.availableCopies--; await book.save(); }`) suffers from race conditions. Multiple threads reading simultaneously see `availableCopies = 1`, resulting in negative inventory (`-1 copies`).

ShelfLife resolves this using MongoDB's document-level atomic update:
```javascript
const book = await Book.findOneAndUpdate(
  { _id: bookId, availableCopies: { $gt: 0 } },
  { $inc: { availableCopies: -1 } },
  { new: true }
);
```
MongoDB guarantees that document updates matching conditional filters are executed atomically. If 10 concurrent requests arrive for a book with 1 copy, exactly one request matches the filter and decrements `availableCopies` to `0`. The remaining 9 requests fail the filter match, return `null`, and receive an immediate `409 Conflict ("No copies available")`.

### 2. Overdue Logic Implementation
Instead of relying on cron jobs or background schedules to mutate the DB `status` field to `'overdue'`, ShelfLife computes overdue status **dynamically at read time**:
`isOverdue = (status === 'issued' && dueDate < new Date())`

When returning a book, if the `dueDate` has passed, the record transitions directly from `'issued'` to `'returned'`, while `isOverdue` is preserved dynamically for reporting.
