import React from 'react';
import { BorrowRecord } from '../types';

/**
 * Pure typed helper function to determine if a record is overdue.
 * A record is overdue when dueDate < now and status !== 'returned'.
 */
export const isOverdueRecord = (record: BorrowRecord): boolean => {
  if (record.isOverdue !== undefined) return record.isOverdue;
  if (record.status === 'returned') return false;
  return new Date(record.dueDate) < new Date();
};

interface StatusBadgeProps {
  record: BorrowRecord;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ record }) => {
  const isOverdue = isOverdueRecord(record);

  if (record.status === 'returned') {
    return <span className="status-badge badge-returned">Returned</span>;
  }

  if (isOverdue || record.status === 'overdue') {
    return <span className="status-badge badge-overdue">Overdue</span>;
  }

  return <span className="status-badge badge-issued">Issued</span>;
};
