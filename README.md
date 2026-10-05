# ShelfLife — Library Management Platform

**ShelfLife** is a submission-ready, production-grade library management platform built for modern university environments. It features a high-performance Express/Node.js REST API with MongoDB atomic operations, a sleek React/TypeScript frontend with glassmorphism UI, and a detailed system design document for 500-campus enterprise scaling.

---

## Directory Structure

```text
shelflife/
├── backend/
│   ├── src/
│   │   ├── config/          # db.js, env.js
│   │   ├── models/          # Book.js, Member.js, BorrowRecord.js, Librarian.js
│   │   ├── routes/          # auth.js, books.js, members.js, borrow.js
│   │   ├── controllers/     # authController, booksController, membersController, borrowController
│   │   ├── middleware/      # auth.js, validate.js, errorHandler.js, requestLogger.js
│   │   ├── validators/      # authValidator, bookValidator, memberValidator, borrowValidator
│   │   ├── utils/           # AppError.js, asyncHandler.js
│   │   ├── scripts/         # seed.js, race-test.js
│   │   ├── app.js           # Express app setup with CORS, Helmet & logger
│   │   └── server.js        # Server entry point with DB connection & graceful shutdown
│   ├── .env.example
│   ├── package.json
│   ├── postman_collection.json
│   ├── requests.http        # Sample HTTP requests for every endpoint
│   └── README.md
├── frontend/
│   ├── src/
│   │   ├── types/           # Book, Member, BorrowRecord, API response types (strict TS)
│   │   ├── api/             # Typed Axios client with auth interceptors & mock mode
│   │   ├── components/      # DataTable<T>, Select<T>, Navbar, ProtectedRoute, StatusBadge, Spinner, ErrorMessage
│   │   ├── pages/           # Login, BookList, IssueBook, MemberHistory
│   │   ├── context/         # AuthContext (token & user persistence)
│   │   ├── App.tsx          # React Router v6 & react-hot-toast Toaster
│   │   ├── main.tsx         # React entry point
│   │   └── index.css        # Glassmorphism dark mode design system & typography
│   ├── index.html           # SEO-optimized HTML5 shell
│   ├── package.json
│   ├── tsconfig.json        # strict: true, noImplicitAny, zero errors
│   ├── vite.config.ts
│   └── README.md
├── system-design/
│   └── Q3_system_design.md  # 10x surge 500-campus architecture, Mermaid diagram, Sharding, Caching, Concurrency
└── README.md                # Root documentation & sub-question verification checklist
```

---

## Quick Start Guide

### Prerequisites
- Node.js (v18 or higher)
- MongoDB instance running locally on `mongodb://localhost:27017/shelflife` (or set `MONGO_URI` in `.env`)

### 1. Running the Backend
```bash
cd backend
npm install
cp .env.example .env
npm run seed       # Seeds librarian, 15 books, 5 members, 8 borrow records (2 overdue)
npm run dev        # Starts API on http://localhost:5000
```

### 2. Testing Concurrency (Race Condition Test)
In a separate terminal (while backend is running):
```bash
cd backend
npm run race-test  # Fires 10 concurrent borrow requests at a 1-copy book
```

### 3. Running the Frontend
```bash
cd frontend
npm install
npm run dev        # Starts Vite dev server on http://localhost:5173
```
*Note: To run the frontend independently without a backend database, set `VITE_USE_MOCK=true` in `frontend/.env`.*

---

## Default Login Credentials

| Role | Email | Password |
|---|---|---|
| Admin Librarian | `librarian@shelflife.com` | `Admin@123` |

---

## Key Assumptions & Design Decisions

1. **Overdue Status Calculation**: Instead of a daily background job mutating DB statuses, overdue records are determined **dynamically at read time** via `isOverdue = (status === 'issued' && dueDate < now)`. This avoids cron synchronization lag and keeps database operations lean.
2. **Atomic Inventory Control**: Inventory decrements use MongoDB's atomic `findOneAndUpdate({ _id, availableCopies: { $gt: 0 } }, { $inc: { availableCopies: -1 } })` rather than read-then-write checks. This prevents race conditions without needing multi-document transaction locks on standalone Mongo nodes.
3. **State Management Choice**: Local component state + React Context for Auth only. Auth token & user profile are the only global app states; book listings and borrow histories represent server state fetched directly on route change.
4. **Mock Mode Option**: Frontend includes a `VITE_USE_MOCK` flag so evaluation can proceed visually even if local MongoDB is not running.

---

## Mapping Checklist & Sub-Question Matrix

| Exam Sub-Question | Requirement Description | Satisfying File(s) / Location |
|---|---|---|
| **Q1a** | Mongoose schemas (Book, Member, BorrowRecord, Librarian, Overdue logic) | `backend/src/models/Book.js`, `Member.js`, `BorrowRecord.js`, `Librarian.js` |
| **Q1b** | Express API endpoints (books, members, borrow, return, history with error codes) | `backend/src/controllers/*`, `backend/src/routes/*` |
| **Q1c** | Middleware (centralized error handler, logger, Zod validator, 404, Helmet, CORS) | `backend/src/middleware/errorHandler.js`, `auth.js`, `validate.js`, `requestLogger.js`, `backend/src/app.js` |
| **Q1d** | Authentication (JWT 8h expiration, protect middleware, bcrypt password hashing) | `backend/src/middleware/auth.js`, `backend/src/controllers/authController.js`, `Librarian.js` |
| **Q1e** | Race condition prevention ($inc atomic conditional update, 4-6 line explanation, race-test.js) | `backend/src/controllers/borrowController.js`, `backend/src/scripts/race-test.js`, `backend/README.md` |
| **Deliverables (Backend)** | Postman collection, requests.http, Seed script | `backend/postman_collection.json`, `backend/requests.http`, `backend/src/scripts/seed.js` |
| **Q2a** | TypeScript interfaces, typed Axios client with interceptors, mock mode flag | `frontend/src/types/index.ts`, `frontend/src/api/client.ts` |
| **Q2b** | Book List page (debounced title search, genre filter, pagination, loading/error states) | `frontend/src/pages/BookList.tsx` |
| **Q2c** | Issue Book form (generic Select<T>, availableCopies > 0 filter, disabled state, toasts) | `frontend/src/pages/IssueBook.tsx` |
| **Q2d** | Member History page (/members/:id/history, StatusBadge, return button) | `frontend/src/pages/MemberHistory.tsx`, `frontend/src/components/StatusBadge.tsx` |
| **Q2e** | Reusable generic components (DataTable<T>, Select<T>) | `frontend/src/components/DataTable.tsx`, `frontend/src/components/Select.tsx` |
| **Q2f** | Route protection & AuthContext (localStorage persistence, ProtectedRoute redirect) | `frontend/src/context/AuthContext.tsx`, `frontend/src/components/ProtectedRoute.tsx`, `frontend/src/pages/Login.tsx` |
| **Deliverables (Frontend)** | Strict tsconfig, zero errors, frontend README note on state management choice | `frontend/tsconfig.json`, `frontend/README.md` |
| **Q3a** | High-level architecture with Mermaid diagram & walkthrough | `system-design/Q3_system_design.md` (§3a) |
| **Q3b** | Database Sharding proposal (Shard keys for Book and BorrowRecord, mathematical justification) | `system-design/Q3_system_design.md` (§3b) |
| **Q3c** | Most read-heavy operation & Redis cache-aside strategy (key format, TTL, cache stampede) | `system-design/Q3_system_design.md` (§3c) |
| **Q3d** | Concurrency guarantee comparison ($inc vs optimistic locking vs distributed locks vs queues) | `system-design/Q3_system_design.md` (§3d) |
| **Q3e** | 10× semester-start surge mitigation & autoscaling vs over-provisioning cost analysis | `system-design/Q3_system_design.md` (§3e) |

---

## AI-Usage Disclosure
This solution was engineered autonomously using Antigravity pair-programming capabilities, utilizing modular architectural patterns, strict TypeScript validation, atomic database updates, and comprehensive system design principles.
