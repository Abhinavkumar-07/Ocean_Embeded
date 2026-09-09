import React from 'react';
import { useOcean } from '../store/OceanContext';
import { DemoBadge } from './DemoBadge';
import { MapPin, Calendar, Layers, Cpu, Database } from 'lucide-react';
import { DEMO_MODELS } from '../data/demoData';

export const ContextBar: React.FC = () => {
  const { state } = useOcean();
  
  const activeModel = DEMO_MODELS.find(m => m.type === state.selectedModel);

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      background: 'rgba(255, 255, 255, 0.02)',
      border: '1px solid var(--card-border)',
      borderRadius: '8px',
      padding: '8px 16px',
      fontSize: '0.8rem',
      color: 'var(--text-secondary)',
      marginBottom: '1.5rem'
    }}>
      <div style={{ display: 'flex', gap: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <MapPin size={14} color="var(--accent-cyan)" />
          <span>Region: <strong style={{ color: 'white', fontWeight: 500 }}>{state.selectedRegion}</strong></span>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Calendar size={14} color="var(--accent-cyan)" />
          <span>Date: <strong style={{ color: 'white', fontWeight: 500 }}>{state.selectedDate}</strong></span>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Layers size={14} color="var(--accent-cyan)" />
          <span>Depth: <strong style={{ color: 'white', fontWeight: 500 }}>{state.selectedDepth} m</strong></span>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Cpu size={14} color="var(--accent-cyan)" />
          <span>Model: <strong style={{ color: 'white', fontWeight: 500 }}>{activeModel?.name || 'OceanEmbed'}</strong></span>
        </div>
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Database size={14} color="var(--accent-cyan)" />
          <span>Source: <strong style={{ color: 'white', fontWeight: 500 }}>{state.dataSource === 'demo' ? 'Precomputed Demo' : 'Live Inference'}</strong></span>
        </div>
        {state.demoMode && <DemoBadge />}
      </div>
    </div>
  );
};
