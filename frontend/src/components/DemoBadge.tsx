import React from 'react';

interface DemoBadgeProps {
  style?: React.CSSProperties;
}

export const DemoBadge: React.FC<DemoBadgeProps> = ({ style }) => (
  <span style={{
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '0.65rem',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: '#F59E0B',
    background: 'rgba(245, 158, 11, 0.12)',
    border: '1px solid rgba(245, 158, 11, 0.25)',
    padding: '2px 8px',
    borderRadius: '4px',
    ...style,
  }}>
    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#F59E0B' }} />
    Demo Data
  </span>
);
