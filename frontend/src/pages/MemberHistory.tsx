import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react';
import { History, User, RotateCcw, Calendar, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { getMemberHistoryApi, getMembersApi, returnBookApi } from '../api/client';
import { BorrowRecord, Member, Book } from '../types';
import { DataTable, Column } from '../components/DataTable';
import { StatusBadge } from '../components/StatusBadge';
import { Select } from '../components/Select';
import { Spinner } from '../components/Spinner';
import { ErrorMessage } from '../components/ErrorMessage';

export const MemberHistory: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [members, setMembers] = useState<Member[]>([]);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [records, setRecords] = useState<BorrowRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [returningId, setReturningId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load all members for selector dropdown
  useEffect(() => {
    getMembersApi()
      .then((data) => {
        setMembers(data);
        // If no ID param or invalid, default to first member
        if (data.length > 0 && (!id || id === 'm1')) {
          navigate(`/members/${data[0]._id}/history`, { replace: true });
        }
      })
      .catch(() => {});
  }, [id, navigate]);

  // Fetch borrow history for selected member
  const fetchHistory = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);

    try {
      const data = await getMemberHistoryApi(id);
      setSelectedMember(data.member);
      setRecords(data.data);
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'message' in err
        ? String(err.message)
        : 'Failed to fetch member borrow history';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleReturnBook = async (borrowId: string) => {
    try {
      setReturningId(borrowId);
      await returnBookApi(borrowId);
      toast.success('Book returned successfully!');
      fetchHistory(); // Refresh history
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err && err.response && typeof err.response === 'object' && 'data' in err.response && err.response.data && typeof err.response.data === 'object' && 'message' in err.response.data
          ? String(err.response.data.message)
          : 'Failed to return book';
      toast.error(msg);
    } finally {
      setReturningId(null);
    }
  };

  const columns: Column<BorrowRecord>[] = [
    {
      header: 'Book Details',
      accessor: (rec) => {
        const book = typeof rec.book === 'object' ? (rec.book as Book) : null;
        return (
          <div>
            <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>
              {book ? book.title : 'Book ID: ' + rec.book}
            </div>
            {book && (
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                by {book.author} ({book.isbn})
              </div>
            )}
          </div>
        );
      },
    },
    {
      header: 'Issued Date',
      accessor: (rec) => (
        <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          {new Date(rec.issueDate).toLocaleDateString()}
        </span>
      ),
    },
    {
      header: 'Due Date',
      accessor: (rec) => (
        <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          {new Date(rec.dueDate).toLocaleDateString()}
        </span>
      ),
    },
    {
      header: 'Status',
      accessor: (rec) => <StatusBadge record={rec} />,
    },
    {
      header: 'Action',
      accessor: (rec) => {
        if (rec.status === 'returned') {
          return (
            <span style={{ fontSize: '0.85rem', color: '#86efac', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <CheckCircle size={14} /> Completed
            </span>
          );
        }
        return (
          <button
            className="btn btn-secondary"
            style={{ padding: '6px 12px', fontSize: '0.85rem' }}
            disabled={returningId === rec._id}
            onClick={() => handleReturnBook(rec._id)}
          >
            {returningId === rec._id ? <Spinner size={14} /> : <RotateCcw size={14} />}
            Return
          </button>
        );
      },
    },
  ];

  return (
    <div className="app-container">
      <div className="glass-card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '1.6rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <History size={24} color="var(--accent-primary)" /> Member Borrow History
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              View active borrows, due dates, overdue statuses, and process returns
            </p>
          </div>

          {/* Member Selector */}
          {members.length > 0 && (
            <div style={{ width: '280px' }}>
              <label className="form-label" htmlFor="history-member-select">Select Member:</label>
              <Select<Member>
                id="history-member-select"
                options={members}
                getLabel={(m) => `${m.name} (${m.membershipId})`}
                getValue={(m) => m._id}
                value={id || ''}
                onChange={(val) => navigate(`/members/${val}/history`)}
              />
            </div>
          )}
        </div>

        {selectedMember && (
          <div style={{ marginTop: '16px', padding: '12px 16px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: 'var(--radius-sm)', display: 'flex', gap: '24px' }}>
            <div>
              <span style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>Member Name: </span>
              <strong>{selectedMember.name}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>Email: </span>
              <strong>{selectedMember.email}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>ID: </span>
              <strong style={{ fontFamily: 'monospace' }}>{selectedMember.membershipId}</strong>
            </div>
          </div>
        )}
      </div>

      {error && <ErrorMessage message={error} onRetry={fetchHistory} />}

      {loading ? (
        <div className="glass-card" style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
          <Spinner size={36} />
        </div>
      ) : (
        <DataTable<BorrowRecord>
          data={records}
          columns={columns}
          rowKey={(r) => r._id}
          emptyMessage="No borrow history recorded for this member."
        />
      )}
    </div>
  );
};
