import React from 'react';
import { STANDARD_DEPTHS } from '../types/ocean';
import { useOcean } from '../store/OceanContext';

export const DepthSelector: React.FC = () => {
  const { state, setDepth } = useOcean();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        Depth (m)
      </label>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
        {STANDARD_DEPTHS.map((d) => (
          <button
            key={d}
            onClick={() => setDepth(d)}
            style={{
              padding: '4px 10px',
              fontSize: '0.75rem',
              borderRadius: '4px',
              border: state.selectedDepth === d
                ? '1px solid var(--accent-cyan)'
                : '1px solid var(--card-border)',
              background: state.selectedDepth === d
                ? 'rgba(56, 189, 248, 0.15)'
                : 'transparent',
              color: state.selectedDepth === d
                ? 'var(--accent-cyan)'
                : 'var(--text-secondary)',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            {d}
          </button>
        ))}
      </div>
      {/* Slider */}
      <input
        type="range"
        min={0}
        max={STANDARD_DEPTHS.length - 1}
        value={state.selectedDepthIndex}
        onChange={(e) => setDepth(STANDARD_DEPTHS[parseInt(e.target.value)])}
        style={{ width: '100%', accentColor: 'var(--accent-cyan)' }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--text-secondary)' }}>
        <span>0 m</span>
        <span>1000 m</span>
      </div>
    </div>
  );
};
