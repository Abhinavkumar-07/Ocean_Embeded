import React, { useMemo } from 'react';
import { useOcean } from '../store/OceanContext';
import { AlertTriangle, Flame, Info, Waves } from 'lucide-react';

interface Alert {
  id: string;
  type: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  icon: React.ReactNode;
}

export const AnomalyAlerts: React.FC = () => {
  const { state } = useOcean();

  const alerts = useMemo(() => {
    const newAlerts: Alert[] = [];
    const isScenarioMode = state.displayMode === 'scenario' && state.scenarioResult;
    const activeProfile = isScenarioMode ? state.scenarioResult!.profile : state.profile?.predicted;
    const baselineProfile = state.profile?.predicted;

    if (!activeProfile || activeProfile.length === 0) return newAlerts;

    const surfaceTemp = activeProfile[0];
    
    // 1. Marine Heatwave Risk
    if (surfaceTemp >= 30.0) {
      newAlerts.push({
        id: 'heatwave',
        type: 'critical',
        title: 'Marine Heatwave Risk',
        message: `Extreme surface temperatures detected (${surfaceTemp.toFixed(1)} °C). High risk of coral bleaching and ecological stress.`,
        icon: <Flame size={18} />
      });
    } else if (surfaceTemp >= 28.5) {
      newAlerts.push({
        id: 'heatwave-warn',
        type: 'warning',
        title: 'Elevated Surface Temperature',
        message: `Surface temperatures are unusually warm (${surfaceTemp.toFixed(1)} °C). Monitor for heatwave development.`,
        icon: <AlertTriangle size={18} />
      });
    }

    // 2. Thermocline Collapse / Mixing (Check difference between 0m and 100m)
    // Find index for roughly 100m depth
    const idx100 = state.depths.findIndex(d => d >= 100);
    if (idx100 > 0 && activeProfile[idx100] !== undefined) {
      const temp100 = activeProfile[idx100];
      const diff = surfaceTemp - temp100;
      // If the top 100m is almost entirely uniform (diff < 1.0)
      if (diff < 1.0) {
        newAlerts.push({
          id: 'thermocline-collapse',
          type: 'warning',
          title: 'Thermocline Degradation',
          message: 'Upper ocean layer is highly mixed. Thermal stratification is exceptionally weak.',
          icon: <Waves size={18} />
        });
      }
    }

    // 3. What-If Scenario Exceedance
    if (isScenarioMode && baselineProfile) {
      const baselineSurface = baselineProfile[0];
      const delta = surfaceTemp - baselineSurface;
      if (Math.abs(delta) > 3.0) {
        newAlerts.push({
          id: 'scenario-extreme',
          type: 'critical',
          title: 'Extreme Scenario Deviation',
          message: `The modeled scenario introduces a severe surface anomaly of ${delta > 0 ? '+' : ''}${delta.toFixed(1)} °C relative to baseline.`,
          icon: <AlertTriangle size={18} />
        });
      }
    }

    return newAlerts;
  }, [state.profile, state.scenarioResult, state.displayMode, state.depths]);

  if (alerts.length === 0) {
    return (
      <div style={{ padding: '1rem', background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Info size={18} color="#10b981" />
        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Conditions are stable. No extreme anomalies detected.</span>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {alerts.map(alert => {
        const bg = alert.type === 'critical' ? 'rgba(239, 68, 68, 0.1)' : alert.type === 'warning' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(59, 130, 246, 0.1)';
        const border = alert.type === 'critical' ? 'rgba(239, 68, 68, 0.3)' : alert.type === 'warning' ? 'rgba(245, 158, 11, 0.3)' : 'rgba(59, 130, 246, 0.3)';
        const color = alert.type === 'critical' ? '#EF4444' : alert.type === 'warning' ? '#F59E0B' : '#3B82F6';

        return (
          <div key={alert.id} style={{
            padding: '1rem',
            background: bg,
            border: `1px solid ${border}`,
            borderRadius: '8px',
            display: 'flex',
            gap: '12px',
            alignItems: 'flex-start',
            animation: alert.type === 'critical' ? 'pulse-border 2s infinite' : 'none'
          }}>
            <div style={{ color: color, marginTop: '2px' }}>
              {alert.icon}
            </div>
            <div>
              <h4 style={{ margin: 0, fontSize: '0.9rem', color: color, fontWeight: 600, marginBottom: '4px' }}>{alert.title}</h4>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>{alert.message}</p>
            </div>
          </div>
        );
      })}
      
      <style>{`
        @keyframes pulse-border {
          0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
          70% { box-shadow: 0 0 0 6px rgba(239, 68, 68, 0); }
          100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
        }
      `}</style>
    </div>
  );
};
