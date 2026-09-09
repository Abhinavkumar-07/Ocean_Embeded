import React from 'react';
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  message?: string;
  height?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  message = 'No data available for the current selection.',
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
    <Inbox size={28} color="var(--text-secondary)" />
    <span style={{ fontSize: '0.85rem', textAlign: 'center', maxWidth: '300px' }}>{message}</span>
  </div>
);
