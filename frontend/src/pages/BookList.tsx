import React, { useState, useEffect, useCallback } from 'react';
import { Search, Filter, BookOpen, ChevronLeft, ChevronRight } from 'lucide-react';
import { getBooksApi } from '../api/client';
import { Book, PaginatedResponse } from '../types';
import { DataTable, Column } from '../components/DataTable';
import { Spinner } from '../components/Spinner';
import { ErrorMessage } from '../components/ErrorMessage';

const GENRES = ['All', 'Fiction', 'Computer Science', 'History', 'Science', 'Philosophy'];

export const BookList: React.FC = () => {
  const [booksData, setBooksData] = useState<PaginatedResponse<Book> | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filter & Pagination state
  const [search, setSearch] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const [genre, setGenre] = useState<string>('All');
  const [page, setPage] = useState<number>(1);
  const limit = 6;

  // Debounce search input (~300ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset to page 1 on new search
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  // Fetch books with proper cleanup
  const fetchBooks = useCallback(async () => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    try {
      const data = await getBooksApi({
        page,
        limit,
        genre: genre === 'All' ? undefined : genre,
        search: debouncedSearch.trim() || undefined,
      });
      if (isMounted) {
        setBooksData(data);
      }
    } catch (err: unknown) {
      if (isMounted) {
        const msg = err && typeof err === 'object' && 'message' in err
          ? String(err.message)
          : 'Failed to load books. Please check backend connection.';
        setError(msg);
      }
    } finally {
      if (isMounted) setLoading(false);
    }

    return () => {
      isMounted = false;
    };
  }, [page, limit, genre, debouncedSearch]);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  // Column definitions for generic DataTable
  const columns: Column<Book>[] = [
    {
      header: 'Title & Author',
      accessor: (book) => (
        <div>
          <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{book.title}</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>by {book.author}</div>
        </div>
      ),
    },
    {
      header: 'ISBN',
      accessor: (book) => (
        <span style={{ fontFamily: 'monospace', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          {book.isbn}
        </span>
      ),
    },
    {
      header: 'Genre',
      accessor: (book) => (
        <span style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '4px 10px', borderRadius: '6px', fontSize: '0.85rem' }}>
          {book.genre}
        </span>
      ),
    },
    {
      header: 'Availability',
      accessor: (book) => {
        const isAvailable = book.availableCopies > 0;
        return (
          <div>
            <span style={{
              fontWeight: 700,
              color: isAvailable ? '#86efac' : '#fca5a5'
            }}>
              {book.availableCopies}
            </span>
            <span style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}> / {book.totalCopies} copies</span>
          </div>
        );
      },
    },
  ];

  return (
    <div className="app-container">
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <BookOpen size={24} color="var(--accent-primary)" /> Library Catalog
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Explore and search real-time book inventory
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="filter-bar">
        <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
          <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '14px', top: '14px' }} />
          <input
            id="book-search-input"
            type="text"
            className="form-input"
            style={{ paddingLeft: '42px' }}
            placeholder="Search by title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div style={{ width: '200px', position: 'relative' }}>
          <Filter size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '14px', top: '14px', zIndex: 1 }} />
          <select
            id="genre-filter-select"
            className="form-select"
            style={{ paddingLeft: '42px' }}
            value={genre}
            onChange={(e) => {
              setGenre(e.target.value);
              setPage(1);
            }}
          >
            {GENRES.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Error State */}
      {error && <ErrorMessage message={error} onRetry={fetchBooks} />}

      {/* Loading State */}
      {loading ? (
        <div className="glass-card" style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
          <Spinner size={36} />
        </div>
      ) : (
        booksData && (
          <>
            <DataTable<Book>
              data={booksData.data}
              columns={columns}
              rowKey={(book) => book._id}
              emptyMessage="No books found matching your search criteria."
            />

            {/* Pagination Controls */}
            {booksData.totalPages > 1 && (
              <div className="pagination">
                <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                  Page {booksData.page} of {booksData.totalPages} ({booksData.total} total books)
                </span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    className="btn btn-secondary"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(p - 1, 1))}
                  >
                    <ChevronLeft size={16} /> Previous
                  </button>
                  <button
                    className="btn btn-secondary"
                    disabled={page >= booksData.totalPages}
                    onClick={() => setPage((p) => Math.min(p + 1, booksData.totalPages))}
                  >
                    Next <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </>
        )
      )}
    </div>
  );
};
