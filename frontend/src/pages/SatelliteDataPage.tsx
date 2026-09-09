import { useState, useEffect } from 'react';
import { useOcean } from '../store/OceanContext';
import { MapComponent } from '../components/MapComponent';
import { MetricCard } from '../components/MetricCard';
import { Charts } from '../components/Charts';
import { Satellite, Download, ArrowRight, Activity, CheckCircle, AlertTriangle, Layers } from 'lucide-react';
import { VARIABLE_META } from '../types/ocean';
import { fetchProfile } from '../data/api';
import { generateDataQuality } from '../data/demoData';

export const SatelliteDataPage = () => {
  const { state, setSource, setPage } = useOcean();
  const [dataQuality, setDataQuality] = useState(generateDataQuality(state.selectedVariable));
  
  // Fake time series just for demonstration of this location
  const [timeSeries, setTimeSeries] = useState<any>(null);

  useEffect(() => {
    setDataQuality(generateDataQuality(state.selectedVariable));
    
    // Simulate fetching a time series for this location
    const fetchTS = async () => {
      try {
        const res = await fetchProfile(state.selectedLatitude, state.selectedLongitude, state.selectedDate);
        // We'll reuse the profile shape as time-series just to show a chart, or build a custom one
        setTimeSeries(res.profile);
      } catch (e) {
        console.error(e);
      }
    };
    fetchTS();
  }, [state.selectedVariable, state.selectedRegion, state.selectedLatitude, state.selectedLongitude, state.selectedDate]);

  const sources = [
    { id: 'MODIS', name: 'MODIS Aqua/Terra', vars: 'SST • Chlorophyll', res: '1km - 4km', temp: 'Daily' },
    { id: 'Sentinel-3', name: 'Sentinel-3 SLSTR', vars: 'SST • SSS', res: '1km', temp: 'Daily' },
    { id: 'ASCAT', name: 'MetOp ASCAT', vars: 'Wind U/V', res: '12.5km', temp: 'Daily' },
    { id: 'Demo', name: 'Demo Source', vars: 'All Variables', res: '1/4°', temp: 'Continuous' },
  ];

  const meta = VARIABLE_META[state.selectedVariable];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', animation: 'fadeIn 0.3s ease' }}>
      
      {/* Header Info */}
      <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Satellite size={20} color="var(--accent-cyan)" /> 
            Satellite Data
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
            Explore and inspect multi-source surface observations used by OceanEmbed.
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
           <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Workflow Step</div>
           <div style={{ display: 'flex', gap: '4px', alignItems: 'center', fontSize: '0.8rem', marginTop: '4px' }}>
              <span style={{ color: 'var(--accent-cyan)', fontWeight: 600 }}>SATELLITE INPUT</span>
              <ArrowRight size={12} color="var(--text-secondary)" />
              <span style={{ color: 'var(--text-secondary)' }}>RECONSTRUCTION</span>
              <ArrowRight size={12} color="var(--text-secondary)" />
              <span style={{ color: 'var(--text-secondary)' }}>VALIDATION</span>
           </div>
        </div>
      </div>

      {/* Data Sources */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
        {sources.map(src => {
          const isSelected = state.selectedSource === src.id;
          return (
            <div 
              key={src.id}
              onClick={() => setSource(src.id)}
              className="glass-panel"
              style={{ 
                padding: '1rem', 
                cursor: 'pointer',
                border: isSelected ? '1px solid var(--accent-cyan)' : '1px solid var(--card-border)',
                background: isSelected ? 'rgba(56, 189, 248, 0.05)' : 'var(--card-bg)',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <strong style={{ fontSize: '1rem', color: isSelected ? 'var(--accent-cyan)' : 'white' }}>{src.name}</strong>
                {isSelected && <CheckCircle size={16} color="var(--accent-cyan)" />}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>{src.vars}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between' }}>
                <span>Res: {src.res}</span>
                <span>{src.temp}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Grid: Map & Quality */}
      <div style={{ display: 'grid', gridTemplateColumns: '2.5fr 1fr', gap: '1.5rem', minHeight: '500px' }}>
        
        {/* Map */}
        <div className="glass-panel" style={{ padding: '1rem', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>{state.selectedRegion} - {meta.longName} ({meta.name})</h3>
            <span style={{ fontSize: '0.8rem', background: 'rgba(255,255,255,0.1)', padding: '4px 8px', borderRadius: '4px' }}>{state.selectedDate}</span>
          </div>
          <div style={{ flex: 1, borderRadius: '8px', overflow: 'hidden', position: 'relative' }}>
             <MapComponent />
          </div>
        </div>

        {/* Data Quality & Stats */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          <div className="glass-panel" style={{ padding: '1rem', flex: 1 }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
               <Activity size={16} color="var(--accent-cyan)" /> Data Quality
            </h3>
            
            <div style={{ marginBottom: '1rem' }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
                 <span>Coverage</span>
                 <span>{dataQuality.coverage}%</span>
               </div>
               <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px' }}>
                 <div style={{ width: `${dataQuality.coverage}%`, height: '100%', background: 'var(--accent-cyan)', borderRadius: '3px' }}></div>
               </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
                 <span>Quality Score</span>
                 <span>{dataQuality.qualityScore}/100</span>
               </div>
               <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px' }}>
                 <div style={{ width: `${dataQuality.qualityScore}%`, height: '100%', background: '#10B981', borderRadius: '3px' }}></div>
               </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
               <MetricCard small icon={<CheckCircle size={14} color="#10B981" />} title="Valid Cells" value={`${dataQuality.validObservations}`} />
               <MetricCard small icon={<AlertTriangle size={14} color="#EF4444" />} title="Missing" value={`${dataQuality.missingPercent}%`} />
            </div>
            
            {state.demoMode && (
              <div style={{ marginTop: '1.5rem', padding: '8px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '4px', fontSize: '0.75rem', color: '#EF4444', textAlign: 'center' }}>
                DEMO DATA
              </div>
            )}
          </div>

          <div className="glass-panel" style={{ padding: '1rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Region Statistics</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
               <MetricCard small title="Mean" value={`27.8 ${meta.unit}`} />
               <MetricCard small title="Median" value={`28.1 ${meta.unit}`} />
               <MetricCard small title="Min" value={`${meta.range[0]} ${meta.unit}`} />
               <MetricCard small title="Max" value={`${meta.range[1]} ${meta.unit}`} />
            </div>
          </div>
        </div>
      </div>

      {/* Time Series & Inspector Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        
        {/* Time Series */}
        <div className="glass-panel" style={{ padding: '1rem' }}>
           <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>
             Location Time Series: {state.selectedLatitude.toFixed(2)}°N, {state.selectedLongitude.toFixed(2)}°E
           </h3>
           {timeSeries ? (
              <Charts type="scatter" data={timeSeries} />
           ) : (
              <div style={{ height: '250px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>Loading time series...</div>
           )}
        </div>

        {/* Selected Data Summary & Actions */}
        <div className="glass-panel" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
           <div>
             <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Selected Observation</h3>
             <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem' }}>
               <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                 <span style={{ color: 'var(--text-secondary)' }}>Region:</span>
                 <span>{state.selectedRegion}</span>
               </div>
               <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                 <span style={{ color: 'var(--text-secondary)' }}>Date:</span>
                 <span>{state.selectedDate}</span>
               </div>
               <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                 <span style={{ color: 'var(--text-secondary)' }}>Location:</span>
                 <span>{state.selectedLatitude.toFixed(2)}°N, {state.selectedLongitude.toFixed(2)}°E</span>
               </div>
               <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                 <span style={{ color: 'var(--text-secondary)' }}>Variable:</span>
                 <span>{meta.name}</span>
               </div>
               <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                 <span style={{ color: 'var(--text-secondary)' }}>Value:</span>
                 <span style={{ fontWeight: 600, color: 'var(--accent-cyan)' }}>28.4 {meta.unit}</span>
               </div>
               <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                 <span style={{ color: 'var(--text-secondary)' }}>Source:</span>
                 <span>{state.selectedSource} {state.demoMode && '(Demo)'}</span>
               </div>
             </div>
           </div>

           <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '1.5rem' }}>
             <button 
                className="btn-outline" 
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                onClick={() => alert("Downloading selected dataset CSV...")}
             >
               <Download size={16} /> Download Selected Data
             </button>
             <button 
                className="btn-primary" 
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                onClick={() => setPage('Temperature')}
             >
               <Layers size={16} /> Continue to Reconstruction
             </button>
           </div>
        </div>

      </div>

    </div>
  );
};
