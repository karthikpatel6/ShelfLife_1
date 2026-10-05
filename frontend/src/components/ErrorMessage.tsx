import React from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ message, onRetry }) => {
  return (
    <div className="error-box">
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <AlertCircle size={20} color="#fca5a5" />
        <span>{message}</span>
      </div>
      {onRetry && (
        <button className="btn btn-secondary" onClick={onRetry} style={{ padding: '6px 12px', fontSize: '0.85rem' }}>
          <RotateCcw size={14} /> Retry
        </button>
      )}
    </div>
  );
};
