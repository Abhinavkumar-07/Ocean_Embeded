import React from 'react';

interface LoadingStateProps {
  message?: string;
  height?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({ message = 'Loading data…', height = '200px' }) => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height,
    gap: '12px',
    color: 'var(--text-secondary)',
  }}>
    <div style={{
      width: '32px',
      height: '32px',
      border: '3px solid var(--card-border)',
      borderTopColor: 'var(--accent-cyan)',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite',
    }} />
    <span style={{ fontSize: '0.85rem' }}>{message}</span>
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);
