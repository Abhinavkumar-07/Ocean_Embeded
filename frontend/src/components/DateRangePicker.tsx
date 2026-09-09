import React from 'react';
import { Calendar } from 'lucide-react';
import { useOcean } from '../store/OceanContext';

export const DateRangePicker: React.FC = () => {
  const { state, setDate } = useOcean();

  const setQuickDate = (daysAgo: number) => {
    const d = new Date('2020-03-31'); // Base demo date
    d.setDate(d.getDate() - daysAgo);
    setDate(d.toISOString().split('T')[0]);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '4px' }}>
        <Calendar size={12} /> Date
      </label>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <input
          type="date"
          value={state.selectedDate}
          min="2020-01-01"
          max="2020-03-31"
          onChange={(e) => setDate(e.target.value)}
          style={{
            background: 'var(--card-bg)',
            border: '1px solid var(--card-border)',
            color: 'var(--text-primary)',
            padding: '6px 12px',
            borderRadius: '6px',
            fontSize: '0.8rem',
            outline: 'none',
          }}
        />
        <div style={{ display: 'flex', gap: '4px' }}>
          <button onClick={() => setQuickDate(0)} style={quickBtnStyle}>Latest</button>
          <button onClick={() => setQuickDate(7)} style={quickBtnStyle}>-7D</button>
          <button onClick={() => setQuickDate(30)} style={quickBtnStyle}>-30D</button>
        </div>
      </div>
    </div>
  );
};

const quickBtnStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid var(--card-border)',
  color: 'var(--text-secondary)',
  padding: '4px 8px',
  borderRadius: '4px',
  fontSize: '0.7rem',
  cursor: 'pointer',
};
