import React from 'react';
import { DISPLAY_VARIABLES, VARIABLE_META } from '../types/ocean';
import { useOcean } from '../store/OceanContext';

export const VariableSelector: React.FC = () => {
  const { state, setVariable } = useOcean();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        Variable
      </label>
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
        {DISPLAY_VARIABLES.map((v) => {
          const meta = VARIABLE_META[v];
          const isActive = state.selectedVariable === v;
          return (
            <button
              key={v}
              onClick={() => setVariable(v)}
              title={`${meta.longName} (${meta.unit})`}
              style={{
                padding: '5px 12px',
                fontSize: '0.75rem',
                borderRadius: '6px',
                border: isActive
                  ? '1px solid var(--accent-cyan)'
                  : '1px solid var(--card-border)',
                background: isActive
                  ? 'rgba(56, 189, 248, 0.15)'
                  : 'transparent',
                color: isActive
                  ? 'var(--accent-cyan)'
                  : 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {meta.name}
            </button>
          );
        })}
      </div>
    </div>
  );
};
