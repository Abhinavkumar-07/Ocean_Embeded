import React from 'react';
import { REGIONS } from '../types/ocean';
import { useOcean } from '../store/OceanContext';
import { MapPin } from 'lucide-react';

export const RegionSelector: React.FC = () => {
  const { state, setRegion } = useOcean();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '4px' }}>
        <MapPin size={12} /> Region
      </label>
      <div style={{ display: 'flex', gap: '6px' }}>
        {REGIONS.map((r) => (
          <button
            key={r}
            onClick={() => setRegion(r)}
            style={{
              flex: 1,
              padding: '6px 10px',
              fontSize: '0.75rem',
              borderRadius: '6px',
              border: state.selectedRegion === r
                ? '1px solid var(--accent-cyan)'
                : '1px solid var(--card-border)',
              background: state.selectedRegion === r
                ? 'rgba(56, 189, 248, 0.15)'
                : 'transparent',
              color: state.selectedRegion === r
                ? 'var(--accent-cyan)'
                : 'var(--text-secondary)',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              whiteSpace: 'nowrap',
            }}
          >
            {r}
          </button>
        ))}
      </div>
    </div>
  );
};
