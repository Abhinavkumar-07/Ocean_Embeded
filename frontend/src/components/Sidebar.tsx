import React from 'react';
import { Home, Satellite, Layers, Box, CheckCircle, Activity, Download, FileText } from 'lucide-react';

export const Sidebar = () => {
  const navItems = [
    { icon: <Home size={18} />, text: 'Dashboard', active: true },
    { icon: <Satellite size={18} />, text: 'Satellite Data' },
    { icon: <Activity size={18} />, text: 'Temperature Reconstruction' },
    { icon: <Box size={18} />, text: '3D Ocean View' },
    { icon: <CheckCircle size={18} />, text: 'Validation (ARGO)' },
    { icon: <Layers size={18} />, text: 'Analysis & Insights' },
    { icon: <Download size={18} />, text: 'Download Data' },
    { icon: <FileText size={18} />, text: 'Documentation' },
  ];

  return (
    <div style={{ width: '250px', background: 'var(--card-bg)', borderRight: '1px solid var(--card-border)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '2rem 1rem', flex: 1 }}>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {navItems.map((item, i) => (
            <li key={i} style={{ 
              display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', 
              borderRadius: '8px', cursor: 'pointer',
              background: item.active ? 'rgba(56, 189, 248, 0.1)' : 'transparent',
              color: item.active ? 'var(--accent-cyan)' : 'var(--text-secondary)',
              border: item.active ? '1px solid var(--accent-cyan)' : '1px solid transparent',
              transition: 'all 0.2s ease'
            }}>
              {item.icon}
              <span style={{ fontSize: '0.9rem', fontWeight: item.active ? 500 : 400 }}>{item.text}</span>
            </li>
          ))}
        </ul>
      </div>
      
      {/* Bottom Ad / Banner */}
      <div style={{ padding: '1rem' }}>
        <div style={{ background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.2) 0%, rgba(59, 130, 246, 0.05) 100%)', border: '1px solid var(--accent-cyan)', padding: '1.5rem', borderRadius: '8px', textAlign: 'left' }}>
          <h3 style={{ color: 'var(--accent-cyan)', fontSize: '1.1rem', marginBottom: '8px' }}>Cleaner Oceans<br/>Stronger Tomorrows</h3>
          <div style={{ width: '30px', height: '2px', background: 'var(--accent-cyan)', marginBottom: '12px' }}></div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Leveraging AI and satellite data for a resilient Indian Ocean.</p>
        </div>
      </div>
    </div>
  );
};
