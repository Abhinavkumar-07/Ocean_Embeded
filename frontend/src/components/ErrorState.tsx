import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
  height?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  message = 'Unable to load data.',
  onRetry,
  height = '200px',
}) => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height,
    gap: '12px',
    color: 'var(--text-secondary)',
  }}>
    <AlertTriangle size={28} color="#EF4444" />
    <span style={{ fontSize: '0.85rem', textAlign: 'center', maxWidth: '300px' }}>{message}</span>
    {onRetry && (
      <button
        onClick={onRetry}
        style={{
          padding: '6px 16px',
          fontSize: '0.8rem',
          background: 'rgba(239, 68, 68, 0.15)',
          color: '#EF4444',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '6px',
          cursor: 'pointer',
        }}
      >
        Retry
      </button>
    )}
  </div>
);
