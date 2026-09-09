import { useState, useMemo } from 'react';
import { useOcean } from '../store/OceanContext';
import { OceanScene } from '../components/ocean3d/OceanScene';
import { useOcean3DData } from '../features/ocean3d/useOcean3DData';
import { STANDARD_DEPTHS } from '../types/ocean';
import {
  Layers,
  Crosshair,
  Maximize,
  Play,
  RotateCcw,
  AlertCircle,
  Thermometer
} from 'lucide-react';
import { Charts } from '../components/Charts';
import type { Ocean3DInstance } from '../features/ocean3d/useOcean3DData';
import { generateARGOProfile } from '../data/demoData';

export default function Ocean3DPage() {
  const { state, setPage, setDepth, setLocation } = useOcean();

  const [viewMode, setViewMode] = useState<'volume' | 'layer' | 'slice'>('volume');
  const [sliceType, setSliceType] = useState<'latitude' | 'longitude'>('latitude');
  const [showGrid, setShowGrid] = useState(true);
  const [selectedInstance, setSelectedInstance] = useState<Ocean3DInstance | null>(null);
  const [resetKey, setResetKey] = useState(0);

  // Extract latitudes and longitudes from the map layout (mocking here since they are in api)
  // In a real app, lat/lon arrays would be attached to reconstructionResult metadata.
  // We'll generate a generic grid of the appropriate size if they are missing.
  const latitudes = useMemo(() => {
    if (!state.reconstructionResult?.data) return [];
    const latCount = state.reconstructionResult.data[0].length;
    return Array.from({ length: latCount }, (_, i) => 15 - (i - Math.floor(latCount/2)) * 0.25);
  }, [state.reconstructionResult]);

  const longitudes = useMemo(() => {
    if (!state.reconstructionResult?.data) return [];
    const lonCount = state.reconstructionResult.data[0][0].length;
    return Array.from({ length: lonCount }, (_, i) => 88 + (i - Math.floor(lonCount/2)) * 0.25);
  }, [state.reconstructionResult]);

  const [sliceCoord, setSliceCoord] = useState(latitudes[Math.floor(latitudes.length / 2)] || 0);

  const { instances, positions, colors, bounds, meta } = useOcean3DData(
    state.reconstructionResult,
    state.reconstructionResult ? state.depths : [],
    latitudes,
    longitudes
  );

  const handlePointSelect = (instance: Ocean3DInstance) => {
    setSelectedInstance(instance);
    setLocation({ lat: instance.lat, lon: instance.lon });
    setDepth(instance.depth);
  };

  // State checks
  if (!state.reconstructionResult) {
    return (
      <div className="glass-panel" style={{ padding: '4rem', textAlign: 'center', marginTop: '2rem' }}>
        <Maximize size={48} color="var(--text-secondary)" style={{ margin: '0 auto 1rem auto' }} />
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>NO RECONSTRUCTION AVAILABLE</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
          Run a Temperature Reconstruction to explore the 3D ocean field.
        </p>
        <button className="primary-btn" onClick={() => setPage('Temperature')}>
          Go to Temperature Reconstruction
        </button>
      </div>
    );
  }

  const isStale = state.reconstructionStatus === 'STALE';

  // Profile Generation (Sync with Phase 4)
  let profileData: any[] = [];
  let referenceArgo: any = null;
  if (selectedInstance) {
     const latIdx = latitudes.indexOf(selectedInstance.lat);
     const lonIdx = longitudes.indexOf(selectedInstance.lon);
     if (latIdx >= 0 && lonIdx >= 0) {
        profileData = state.depths.map((d, dIdx) => ({
          depth: d,
          temperature: state.reconstructionResult!.data[dIdx][latIdx][lonIdx]
        }));
        
        const mockFloat = { id: 'mock', lat: selectedInstance.lat, lon: selectedInstance.lon, date: state.selectedDate, numProfiles: 1, status: 'active' as const };
        referenceArgo = generateARGOProfile(mockFloat);
        profileData.forEach(pt => {
           const argoPt = referenceArgo?.measurements.find((m: any) => m.depth === pt.depth);
           if (argoPt) {
             pt.argoTemperature = argoPt.temperature;
           }
        });
     }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', height: 'calc(100vh - 100px)' }}>
      
      {isStale && (
        <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', padding: '1rem', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
             <AlertCircle color="#ef4444" />
             <div>
               <strong style={{ color: '#ef4444' }}>RECONSTRUCTION OUTDATED</strong>
               <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>The current configuration differs from the displayed reconstruction.</p>
             </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="secondary-btn" onClick={() => setPage('Temperature')}>Return to Reconstruction</button>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '250px 1fr 300px', gap: '1.5rem', flex: 1, minHeight: 0 }}>
        
        {/* LEFT PANEL: CONTROLS */}
        <div className="glass-panel" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', overflowY: 'auto' }}>
          <div>
            <h3 style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '1rem', letterSpacing: '1px' }}>View Mode</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button 
                className={viewMode === 'volume' ? 'primary-btn' : 'secondary-btn'}
                onClick={() => setViewMode('volume')}
                style={{ justifyContent: 'flex-start' }}
              >
                <Maximize size={16} /> 3D Volume
              </button>
              <button 
                className={viewMode === 'layer' ? 'primary-btn' : 'secondary-btn'}
                onClick={() => setViewMode('layer')}
                style={{ justifyContent: 'flex-start' }}
              >
                <Layers size={16} /> Layer View
              </button>
              <button 
                className={viewMode === 'slice' ? 'primary-btn' : 'secondary-btn'}
                onClick={() => setViewMode('slice')}
                style={{ justifyContent: 'flex-start' }}
              >
                <Crosshair size={16} /> Vertical Slice
              </button>
            </div>
          </div>

          {viewMode === 'layer' && (
            <div>
              <h3 style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '1rem', letterSpacing: '1px' }}>Depth Layer</h3>
              <select 
                value={state.selectedDepth}
                onChange={(e) => setDepth(Number(e.target.value))}
                style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--card-border)', color: 'white', padding: '8px', borderRadius: '4px' }}
              >
                {STANDARD_DEPTHS.map(d => (
                  <option key={d} value={d}>{d} m</option>
                ))}
              </select>
            </div>
          )}

          {viewMode === 'slice' && (
            <div>
              <h3 style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '1rem', letterSpacing: '1px' }}>Cross Section</h3>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '1rem' }}>
                 <button 
                   className={sliceType === 'latitude' ? 'primary-btn' : 'secondary-btn'} 
                   style={{ flex: 1, padding: '4px' }}
                   onClick={() => {
                     setSliceType('latitude');
                     setSliceCoord(latitudes[Math.floor(latitudes.length/2)]);
                   }}
                 >Lat</button>
                 <button 
                   className={sliceType === 'longitude' ? 'primary-btn' : 'secondary-btn'} 
                   style={{ flex: 1, padding: '4px' }}
                   onClick={() => {
                     setSliceType('longitude');
                     setSliceCoord(longitudes[Math.floor(longitudes.length/2)]);
                   }}
                 >Lon</button>
              </div>
              <input 
                type="range" 
                min={sliceType === 'latitude' ? latitudes[0] : longitudes[0]} 
                max={sliceType === 'latitude' ? latitudes[latitudes.length-1] : longitudes[longitudes.length-1]} 
                step={0.25}
                value={sliceCoord}
                onChange={(e) => setSliceCoord(Number(e.target.value))}
                style={{ width: '100%' }}
              />
              <div style={{ textAlign: 'center', fontSize: '0.8rem', marginTop: '4px' }}>
                {sliceCoord.toFixed(2)}° {sliceType === 'latitude' ? 'N' : 'E'}
              </div>
            </div>
          )}

          <div>
             <h3 style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '1rem', letterSpacing: '1px' }}>Display</h3>
             <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={showGrid} onChange={e => setShowGrid(e.target.checked)} />
                Show Reference Grid
             </label>
             <button className="secondary-btn" style={{ width: '100%', marginTop: '1rem' }}>
                <Play size={16} /> Animation (1/1 Date)
             </button>
             <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textAlign: 'center', marginTop: '4px' }}>Multiple dates required.</p>
          </div>
        </div>

        {/* MIDDLE PANEL: 3D VIEWPORT */}
        <div className="glass-panel" style={{ position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
           <div style={{ position: 'absolute', top: '1rem', left: '1rem', zIndex: 10, background: 'rgba(0,0,0,0.5)', padding: '4px 12px', borderRadius: '20px', fontSize: '0.8rem', display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#38bdf8' }}></span>
              Demo Data
           </div>
           
           <div style={{ position: 'absolute', top: '1rem', right: '1rem', zIndex: 10 }}>
              <button className="secondary-btn" onClick={() => setResetKey(k => k + 1)}>
                 <RotateCcw size={16} /> Reset
              </button>
           </div>

           <div style={{ flex: 1 }}>
             <OceanScene 
               key={resetKey}
               instances={instances}
               positions={positions}
               colors={colors}
               bounds={bounds}
               meta={meta}
               viewMode={viewMode}
               selectedDepthIndex={state.selectedDepthIndex}
               sliceType={sliceType}
               sliceCoord={sliceCoord}
               onPointSelect={handlePointSelect}
               showGrid={showGrid}
             />
           </div>

           {/* Temperature Legend */}
           {meta && (
             <div style={{ position: 'absolute', bottom: '1rem', left: '50%', transform: 'translateX(-50%)', zIndex: 10, background: 'rgba(15, 23, 42, 0.8)', padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--card-border)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '0.75rem' }}>{meta.minTemp}°C</span>
                <div style={{ width: '200px', height: '8px', background: 'linear-gradient(to right, rgb(0,0,100), rgb(0,202,228), rgb(255,255,255), rgb(255,202,228))', borderRadius: '4px' }}></div>
                <span style={{ fontSize: '0.75rem' }}>{meta.maxTemp}°C</span>
             </div>
           )}
        </div>

        {/* RIGHT PANEL: METADATA & PROFILE */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', overflowY: 'auto' }}>
           
           <div className="glass-panel" style={{ padding: '1rem' }}>
              <h3 style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '1rem', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Crosshair size={16} /> Point Probe
              </h3>
              
              {!selectedInstance ? (
                 <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textAlign: 'center' }}>Click a point in the 3D volume to inspect.</p>
              ) : (
                 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.9rem' }}>
                    <div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>Latitude</div>
                      <div>{selectedInstance.lat.toFixed(2)}° N</div>
                    </div>
                    <div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>Longitude</div>
                      <div>{selectedInstance.lon.toFixed(2)}° E</div>
                    </div>
                    <div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>Depth</div>
                      <div style={{ color: 'var(--accent-cyan)' }}>{selectedInstance.depth} m</div>
                    </div>
                    <div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>Temperature</div>
                      <div style={{ color: '#ef4444' }}>{selectedInstance.value.toFixed(2)} °C</div>
                    </div>
                 </div>
              )}
           </div>

           {selectedInstance && profileData.length > 0 && (
             <div className="glass-panel" style={{ padding: '1rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '1rem', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Thermometer size={16} /> Vertical Profile
                </h3>
                <div style={{ flex: 1, minHeight: '200px' }}>
                   {/* We can re-use the generic charts component or directly plot */}
                   <Charts type="profile" data={{ profile: profileData }} />
                </div>
             </div>
           )}

           <div className="glass-panel" style={{ padding: '1rem' }}>
              <h3 style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '1rem', letterSpacing: '1px' }}>Model Metadata</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.8rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                   <span style={{ color: 'var(--text-secondary)' }}>Model</span>
                   <span>{state.selectedModel}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                   <span style={{ color: 'var(--text-secondary)' }}>Temporal</span>
                   <span>{state.temporalWindow} days</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                   <span style={{ color: 'var(--text-secondary)' }}>Region</span>
                   <span style={{ textAlign: 'right' }}>{state.selectedRegion}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                   <span style={{ color: 'var(--text-secondary)' }}>Depths</span>
                   <span>0 – 1000m</span>
                </div>
              </div>
           </div>

           <button className="primary-btn" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setPage('Validation')}>
             Validate with ARGO →
           </button>

        </div>

      </div>
    </div>
  );
}
