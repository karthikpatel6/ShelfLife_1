export type BorrowStatus = 'issued' | 'returned' | 'overdue';

export interface Book {
  _id: string;
  title: string;
  author: string;
  isbn: string;
  genre: string;
  totalCopies: number;
  availableCopies: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Member {
  _id: string;
  name: string;
  email: string;
  membershipId: string;
  joinedDate?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface BorrowRecord {
  _id: string;
  book: Book | string;
  member: Member | string;
  issueDate: string;
  dueDate: string;
  returnDate: string | null;
  status: BorrowStatus;
  isOverdue?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface Librarian {
  id: string;
  name: string;
  email: string;
}

export interface LoginResponse {
  success: boolean;
  token: string;
  librarian: Librarian;
}

export interface ApiError {
  success: boolean;
  message: string;
  errors?: Array<{ field: string; message: string }> | string[];
}
