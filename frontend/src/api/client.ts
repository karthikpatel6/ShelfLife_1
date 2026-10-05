import axios, { AxiosInstance, AxiosError } from 'axios';
import {
  Book,
  Member,
  BorrowRecord,
  PaginatedResponse,
  LoginResponse,
} from '../types';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

// Create base Axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach JWT Token from localStorage
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('shelflife_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response Interceptor: Auto-redirect on 401 Unauthorized
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('shelflife_token');
      localStorage.removeItem('shelflife_user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ─── MOCK DATA FALLBACK (When VITE_USE_MOCK=true) ────────────────────────────
const mockBooks: Book[] = [
  { _id: 'b1', title: 'The Great Gatsby', author: 'F. Scott Fitzgerald', isbn: '9780743273565', genre: 'Fiction', totalCopies: 5, availableCopies: 3 },
  { _id: 'b2', title: 'Clean Code', author: 'Robert C. Martin', isbn: '9780132350884', genre: 'Computer Science', totalCopies: 4, availableCopies: 2 },
  { _id: 'b3', title: 'Sapiens: A Brief History', author: 'Yuval Noah Harari', isbn: '9780062316097', genre: 'History', totalCopies: 5, availableCopies: 0 },
  { _id: 'b4', title: '1984', author: 'George Orwell', isbn: '9780451524935', genre: 'Fiction', totalCopies: 6, availableCopies: 1 },
  { _id: 'b5', title: 'The Pragmatic Programmer', author: 'David Thomas', isbn: '9780135957059', genre: 'Computer Science', totalCopies: 3, availableCopies: 1 },
];

const mockMembers: Member[] = [
  { _id: 'm1', name: 'Alice Johnson', email: 'alice@example.com', membershipId: 'MEM001' },
  { _id: 'm2', name: 'Bob Smith', email: 'bob@example.com', membershipId: 'MEM002' },
  { _id: 'm3', name: 'Carol White', email: 'carol@example.com', membershipId: 'MEM003' },
  { _id: 'm4', name: 'David Brown', email: 'david@example.com', membershipId: 'MEM004' },
];

const mockRecords: BorrowRecord[] = [
  {
    _id: 'r1',
    book: mockBooks[0],
    member: mockMembers[0],
    issueDate: new Date(Date.now() - 5 * 86400000).toISOString(),
    dueDate: new Date(Date.now() + 9 * 86400000).toISOString(),
    returnDate: null,
    status: 'issued',
    isOverdue: false,
  },
  {
    _id: 'r2',
    book: mockBooks[3],
    member: mockMembers[0],
    issueDate: new Date(Date.now() - 25 * 86400000).toISOString(),
    dueDate: new Date(Date.now() - 11 * 86400000).toISOString(),
    returnDate: null,
    status: 'issued',
    isOverdue: true,
  },
];

// ─── TYPED API FUNCTIONS ──────────────────────────────────────────────────────

export const loginApi = async (email: string, password: string): Promise<LoginResponse> => {
  if (USE_MOCK) {
    return {
      success: true,
      token: 'mock-jwt-token-12345',
      librarian: { id: 'l1', name: 'Demo Librarian', email },
    };
  }
  const response = await apiClient.post<LoginResponse>('/auth/login', { email, password });
  return response.data;
};

export const getBooksApi = async (params?: {
  page?: number;
  limit?: number;
  genre?: string;
  search?: string;
}): Promise<PaginatedResponse<Book>> => {
  if (USE_MOCK) {
    let filtered = [...mockBooks];
    if (params?.genre) {
      filtered = filtered.filter((b) => b.genre.toLowerCase() === params.genre?.toLowerCase());
    }
    if (params?.search) {
      filtered = filtered.filter((b) => b.title.toLowerCase().includes(params.search!.toLowerCase()));
    }
    return {
      success: true,
      data: filtered,
      page: params?.page || 1,
      limit: params?.limit || 10,
      total: filtered.length,
      totalPages: 1,
    };
  }
  const response = await apiClient.get<PaginatedResponse<Book>>('/books', { params });
  return response.data;
};

export const getMembersApi = async (): Promise<Member[]> => {
  if (USE_MOCK) return mockMembers;
  // Endpoint or list helper
  const response = await apiClient.get<{ success: boolean; data: Member[] }>('/members');
  return response.data.data || [];
};

export const issueBookApi = async (bookId: string, memberId: string): Promise<BorrowRecord> => {
  if (USE_MOCK) {
    const book = mockBooks.find((b) => b._id === bookId);
    const member = mockMembers.find((m) => m._id === memberId);
    if (!book || book.availableCopies <= 0) {
      throw new Error('No copies available');
    }
    book.availableCopies--;
    const newRecord: BorrowRecord = {
      _id: `r_${Date.now()}`,
      book: book,
      member: member || memberId,
      issueDate: new Date().toISOString(),
      dueDate: new Date(Date.now() + 14 * 86400000).toISOString(),
      returnDate: null,
      status: 'issued',
      isOverdue: false,
    };
    mockRecords.push(newRecord);
    return newRecord;
  }
  const response = await apiClient.post<{ success: boolean; data: BorrowRecord }>('/borrow', {
    bookId,
    memberId,
  });
  return response.data.data;
};

export const returnBookApi = async (borrowId: string): Promise<BorrowRecord> => {
  if (USE_MOCK) {
    const record = mockRecords.find((r) => r._id === borrowId);
    if (!record) throw new Error('Borrow record not found');
    record.status = 'returned';
    record.returnDate = new Date().toISOString();
    record.isOverdue = false;
    return record;
  }
  const response = await apiClient.post<{ success: boolean; data: BorrowRecord }>(
    `/return/${borrowId}`
  );
  return response.data.data;
};

export const getMemberHistoryApi = async (
  memberId: string
): Promise<{ member: Member; data: BorrowRecord[] }> => {
  if (USE_MOCK) {
    const member = mockMembers.find((m) => m._id === memberId) || mockMembers[0];
    const records = mockRecords.filter(
      (r) => (typeof r.member === 'object' ? r.member._id : r.member) === memberId
    );
    return { member, data: records };
  }
  const response = await apiClient.get<{
    success: boolean;
    member: Member;
    data: BorrowRecord[];
  }>(`/members/${memberId}/history`);
  return { member: response.data.member, data: response.data.data };
};
