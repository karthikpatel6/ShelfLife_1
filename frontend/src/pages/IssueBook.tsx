import React, { useState, useEffect } from 'react';
import { PlusCircle, User, BookOpen, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { getBooksApi, getMembersApi, issueBookApi } from '../api/client';
import { Book, Member } from '../types';
import { Select } from '../components/Select';
import { Spinner } from '../components/Spinner';

export const IssueBook: React.FC = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedBookId, setSelectedBookId] = useState<string>('');
  const [selectedMemberId, setSelectedMemberId] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [booksRes, membersList] = await Promise.all([
          getBooksApi({ limit: 100 }),
          getMembersApi(),
        ]);
        setBooks(booksRes.data);
        setMembers(membersList);
      } catch (err: unknown) {
        toast.error('Failed to load books or members list');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Filter books with availableCopies > 0
  const availableBooks = books.filter((b) => b.availableCopies > 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBookId || !selectedMemberId) {
      toast.error('Please select both a member and a book');
      return;
    }

    try {
      setSubmitting(true);
      const record = await issueBookApi(selectedBookId, selectedMemberId);
      toast.success('Book issued successfully!');

      // Reset form
      setSelectedBookId('');
      setSelectedMemberId('');

      // Refresh books list to reflect updated availableCopies
      const booksRes = await getBooksApi({ limit: 100 });
      setBooks(booksRes.data);
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err && err.response && typeof err.response === 'object' && 'data' in err.response && err.response.data && typeof err.response.data === 'object' && 'message' in err.response.data
          ? String(err.response.data.message)
          : err instanceof Error
          ? err.message
          : 'Failed to issue book';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="app-container" style={{ display: 'flex', justifyContent: 'center', paddingTop: '80px' }}>
        <Spinner size={36} />
      </div>
    );
  }

  return (
    <div className="app-container" style={{ maxWidth: '640px' }}>
      <div className="glass-card">
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '1.6rem', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <PlusCircle size={24} color="var(--accent-primary)" /> Issue Book to Member
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Select an active member and an available title from the library inventory
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Member Generic Select */}
          <div className="form-group">
            <label className="form-label" htmlFor="member-select" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <User size={16} /> Select Member
            </label>
            <Select<Member>
              id="member-select"
              options={members}
              getLabel={(m) => `${m.name} (${m.membershipId}) - ${m.email}`}
              getValue={(m) => m._id}
              value={selectedMemberId}
              onChange={(val) => setSelectedMemberId(val)}
              placeholder="-- Choose a registered member --"
              disabled={submitting}
            />
          </div>

          {/* Book Generic Select (Only books with availableCopies > 0) */}
          <div className="form-group" style={{ marginBottom: '28px' }}>
            <label className="form-label" htmlFor="book-select" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <BookOpen size={16} /> Select Available Book
            </label>
            <Select<Book>
              id="book-select"
              options={availableBooks}
              getLabel={(b) => `${b.title} by ${b.author} [${b.availableCopies} available]` }
              getValue={(b) => b._id}
              value={selectedBookId}
              onChange={(val) => setSelectedBookId(val)}
              placeholder={
                availableBooks.length === 0
                  ? 'No books currently available to issue'
                  : '-- Choose a book to issue --'
              }
              disabled={submitting || availableBooks.length === 0}
            />
            {availableBooks.length === 0 && (
              <span style={{ fontSize: '0.8rem', color: '#fca5a5', marginTop: '4px' }}>
                All book copies are currently checked out.
              </span>
            )}
          </div>

          {/* Submit button with loading state */}
          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '12px' }}
            disabled={submitting || !selectedBookId || !selectedMemberId}
          >
            {submitting ? <Spinner size={20} /> : <CheckCircle size={18} />}
            {submitting ? 'Issuing...' : 'Confirm & Issue Book'}
          </button>
        </form>
      </div>
    </div>
  );
};
