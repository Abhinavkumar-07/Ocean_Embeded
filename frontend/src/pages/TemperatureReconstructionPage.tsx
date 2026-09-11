import { useEffect } from 'react';
import { useOcean } from '../store/OceanContext';
import { useReconstructionWorkflow } from '../features/reconstruction/useReconstructionWorkflow';
import { MODEL_TYPES, DISPLAY_VARIABLES, VARIABLE_META } from '../types/ocean';
import { MapComponent } from '../components/MapComponent';
import { DepthSelector } from '../components/DepthSelector';
import {
  Activity,
  Layers,
  Calendar,
  Cpu,
  Settings,
  Database,
  CheckCircle,
  AlertTriangle,
  Map as MapIcon,
  Crosshair,
  BarChart2,
  Droplets
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Label
} from 'recharts';
import type { ARGOProfile } from '../types/ocean';
import { generateARGOProfile } from '../data/demoData';

interface ProfileDataPoint {
  depth: number;
  temperature: number | null;
  argoTemperature?: number | null;
}

export default function TemperatureReconstructionPage() {
  const { 
    state, setDate, setModel, setTemporalWindow, setPage, 
    setReconstructionStatus, setSelectedVariables, setVariable 
  } = useOcean();
  
  const { startReconstruction } = useReconstructionWorkflow();

  const isRunning = [
    'LOADING',
    'PREPROCESSING',
    'EMBEDDING',
    'INFERENCE',
    'POST-PROCESSING',
  ].includes(state.reconstructionStatus);

  const isComplete = state.reconstructionStatus === 'COMPLETE';
  const isStale = state.reconstructionStatus === 'STALE';

  // Mark stale if config changed after a successful run
  useEffect(() => {
    if (state.reconstructionStatus === 'COMPLETE') {
      const res = state.reconstructionResult;
      if (
        res &&
        (res.date !== state.selectedDate ||
          res.region !== state.selectedRegion ||
          res.model !== state.selectedModel ||
          res.temporalWindow !== state.temporalWindow ||
          JSON.stringify([...res.inputVariables].sort()) !== JSON.stringify([...state.selectedVariables].sort()))
      ) {
        setReconstructionStatus('STALE');
      }
    }
  }, [
    state.selectedDate,
    state.selectedRegion,
    state.selectedModel,
    state.temporalWindow,
    state.selectedVariables,
    state.reconstructionStatus,
    state.reconstructionResult,
    setReconstructionStatus
  ]);

  // Profile Generation (Linked dynamically to coordinates)
  let profileData: ProfileDataPoint[] = [];
  let referenceArgo: ARGOProfile | null = null;

  if (state.reconstructionResult && isComplete) {
    // We use a simplified lat/lon to index conversion matching the demo bounding boxes
    const { latMin, latMax, lonMin, lonMax } = { latMin: 5, latMax: 30, lonMin: 45, lonMax: 105 }; 
    const latIdx = Math.round(((state.selectedLatitude - latMin) / (latMax - latMin)) * 50);
    const lonIdx = Math.round(((state.selectedLongitude - lonMin) / (lonMax - lonMin)) * 120);
    
    if (latIdx >= 0 && latIdx < 51 && lonIdx >= 0 && lonIdx < 121) {
      profileData = state.depths.map((depth, dIdx) => {
        const grid = state.reconstructionResult!.data[dIdx];
        const val = grid && grid[latIdx] ? grid[latIdx][lonIdx] : null;
        return { depth, temperature: val };
      }).filter(p => p.temperature !== null);
    }
    
    referenceArgo = generateARGOProfile({
      id: 'demo', lat: state.selectedLatitude, lon: state.selectedLongitude, date: state.selectedDate, numProfiles: 1, status: 'active'
    });
    
    profileData = profileData.map((p, i) => ({
      ...p,
      argoTemperature: referenceArgo?.argoTemp[i] || null
    }));
  }

  // Toggle for multi-variable selection
  const handleVariableToggle = (v: typeof DISPLAY_VARIABLES[number]) => {
    if (state.selectedVariables.includes(v)) {
      if (state.selectedVariables.length > 1) {
        setSelectedVariables(state.selectedVariables.filter(x => x !== v));
      }
    } else {
      setSelectedVariables([...state.selectedVariables, v]);
    }
    // Also sync the single selected variable for the map view to display one of them
    setVariable(v);
  };

  const WorkflowStep = ({ step, label, active, complete }: { step: string, label: string, active: boolean, complete: boolean }) => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', opacity: active || complete ? 1 : 0.4, flex: 1, position: 'relative' }}>
      <div style={{ 
        width: '32px', height: '32px', borderRadius: '50%', 
        background: complete ? 'var(--accent-cyan)' : active ? 'rgba(56, 189, 248, 0.2)' : 'var(--card-border)',
        color: complete ? '#000' : (active ? 'var(--accent-cyan)' : 'var(--text-secondary)'),
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: 600,
        border: active && !complete ? '2px solid var(--accent-cyan)' : 'none',
        zIndex: 2
      }}>
        {complete ? <CheckCircle size={16} /> : step}
      </div>
      <span style={{ fontSize: '0.75rem', fontWeight: active ? 600 : 400, color: active || complete ? 'var(--accent-cyan)' : 'var(--text-secondary)', textAlign: 'center', lineHeight: 1.2 }}>{label}</span>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', animation: 'fadeIn 0.3s ease' }}>
      
      {/* HEADER */}
      <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Layers size={20} color="var(--accent-cyan)" /> 
            Temperature Reconstruction Workstation
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
            Configure surface inputs and execute the depth-aware spatial encoding pipeline.
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
           <div style={{ fontSize: '0.65rem', padding: '2px 6px', background: 'rgba(56, 189, 248, 0.1)', color: 'var(--accent-cyan)', border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: '4px', display: 'inline-block' }}>
             PRECOMPUTED BENCHMARK
           </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        
        {/* =========================================
            ZONE 1: INPUT ZONE
            ========================================= */}
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--card-border)', paddingBottom: '0.5rem' }}>
            <Droplets size={18} color="var(--accent-cyan)" /> 1. Surface Observations (Inputs)
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Variables */}
            <div>
              <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '8px' }}>
                <span>Input Variables</span>
                <span>Map Layer: {VARIABLE_META[state.selectedVariable].name}</span>
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {DISPLAY_VARIABLES.map(v => {
                   const isActive = state.selectedVariables.includes(v);
                   return (
                     <button
                       key={v}
                       onClick={() => handleVariableToggle(v)}
                       style={{ 
                         padding: '6px 12px', fontSize: '0.8rem', borderRadius: '4px', cursor: 'pointer',
                         background: isActive ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
                         border: isActive ? '1px solid var(--accent-cyan)' : '1px solid var(--card-border)',
                         color: isActive ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                         transition: 'all 0.2s'
                       }}
                     >
                       {VARIABLE_META[v].name}
                     </button>
                   );
                })}
              </div>
            </div>

            {/* Map */}
            <div style={{ flex: 1, minHeight: '300px', display: 'flex', flexDirection: 'column' }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                 <span>Target Location (Click Map)</span>
                 <span style={{ color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                   <Crosshair size={12} /> {state.selectedLatitude.toFixed(2)}°N, {state.selectedLongitude.toFixed(2)}°E
                 </span>
               </div>
               <div style={{ flex: 1, borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--card-border)' }}>
                 <MapComponent surfaceData={state.surfaceData} />
               </div>
            </div>
          </div>
        </div>

        {/* =========================================
            ZONE 2: PIPELINE ZONE
            ========================================= */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Configuration */}
          <div className="glass-panel" style={{ padding: '1.5rem', position: 'relative' }}>
            {isRunning && (
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(2px)', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px' }}>
                <div style={{ background: 'var(--card-bg)', border: '1px solid var(--accent-cyan)', padding: '0.5rem 1rem', borderRadius: '4px', color: 'var(--accent-cyan)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Activity size={16} className="animate-spin" /> Configuration Locked During Inference
                </div>
              </div>
            )}
            
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--card-border)', paddingBottom: '0.5rem' }}>
              <Settings size={18} color="var(--accent-cyan)" /> 2. Pipeline Configuration
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '4px' }}>Target Date</label>
                <div style={{ position: 'relative' }}>
                  <Calendar size={16} color="var(--text-secondary)" style={{ position: 'absolute', left: '10px', top: '10px' }} />
                  <input
                    type="date"
                    value={state.selectedDate}
                    onChange={(e) => setDate(e.target.value)}
                    style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--card-border)', borderRadius: '4px', padding: '8px 8px 8px 32px', color: 'white', fontSize: '0.9rem', outline: 'none' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '4px' }}>Temporal Window</label>
                <div style={{ display: 'flex', gap: '4px' }}>
                  {[1, 3, 5, 7].map((w) => (
                    <button
                      key={w}
                      onClick={() => setTemporalWindow(w)}
                      style={{ 
                        flex: 1, padding: '6px', fontSize: '0.8rem', borderRadius: '4px', cursor: 'pointer',
                        background: state.temporalWindow === w ? 'rgba(56, 189, 248, 0.1)' : 'transparent',
                        border: state.temporalWindow === w ? '1px solid var(--accent-cyan)' : '1px solid var(--card-border)',
                        color: state.temporalWindow === w ? 'var(--accent-cyan)' : 'var(--text-secondary)'
                      }}
                    >
                      ±{w}d
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '4px' }}>Model Architecture</label>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '8px', fontStyle: 'italic' }}>
                Reference configuration — running on precomputed historical checkpoints.
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {MODEL_TYPES.map((m) => (
                  <button
                    key={m}
                    onClick={() => setModel(m)}
                    style={{ 
                      textAlign: 'left', padding: '10px 12px', borderRadius: '4px', cursor: 'pointer',
                      background: state.selectedModel === m ? 'rgba(56, 189, 248, 0.1)' : 'rgba(0,0,0,0.2)',
                      border: state.selectedModel === m ? '1px solid var(--accent-cyan)' : '1px solid var(--card-border)',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.85rem', color: state.selectedModel === m ? 'var(--accent-cyan)' : 'white', fontWeight: 500, marginBottom: '2px' }}>
                        {m === 'oceanembed' ? 'OceanEmbed (Depth-Aware)' : m === 'cnn_gru' ? 'CNN + GRU' : 'Baseline CNN'}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        {m === 'oceanembed' ? 'Spatiotemporal embedding with vertical attention' : 'Standard 2D architecture (Baseline)'}
                      </div>
                    </div>
                    {state.selectedModel === m && <CheckCircle size={16} color="var(--accent-cyan)" />}
                  </button>
                ))}
              </div>
            </div>
            
            <button
              onClick={startReconstruction}
              disabled={isRunning}
              className={isRunning ? 'btn-outline' : 'btn-primary'}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '14px', fontSize: '1rem', fontWeight: 600 }}
            >
              {isRunning ? <><Activity size={18} className="animate-spin" /> RUNNING PIPELINE...</> : <><Cpu size={18} /> RUN RECONSTRUCTION</>}
            </button>
            
            {isStale && !isRunning && (
              <div style={{ marginTop: '1rem', padding: '12px', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: '4px', fontSize: '0.8rem', color: '#F59E0B', display: 'flex', gap: '8px' }}>
                <AlertTriangle size={16} style={{ flexShrink: 0 }} /> 
                <div>
                  <strong>Configuration Changed</strong><br/>
                  The current output map below belongs to a previous configuration. Run reconstruction to update.
                </div>
              </div>
            )}
          </div>

          {/* Workflow Status */}
          <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity size={18} color="var(--accent-cyan)" /> Pipeline Status
            </h3>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative' }}>
               {/* Progress Line */}
               <div style={{ position: 'absolute', top: '16px', left: '10%', right: '10%', height: '2px', background: 'var(--card-border)', zIndex: 1 }}></div>
               <div style={{ position: 'absolute', top: '16px', left: '10%', height: '2px', background: 'var(--accent-cyan)', zIndex: 1, transition: 'width 0.3s ease',
                  width: state.reconstructionStatus === 'IDLE' ? '0%' 
                       : state.reconstructionStatus === 'PREPROCESSING' ? '20%'
                       : state.reconstructionStatus === 'EMBEDDING' ? '50%'
                       : state.reconstructionStatus === 'INFERENCE' ? '80%'
                       : '100%' 
               }}></div>
               
               <WorkflowStep step="1" label="Preprocess" active={state.reconstructionStatus === 'PREPROCESSING'} complete={['EMBEDDING', 'INFERENCE', 'POST-PROCESSING', 'COMPLETE', 'STALE'].includes(state.reconstructionStatus)} />
               <WorkflowStep step="2" label="Encode" active={state.reconstructionStatus === 'EMBEDDING'} complete={['INFERENCE', 'POST-PROCESSING', 'COMPLETE', 'STALE'].includes(state.reconstructionStatus)} />
               <WorkflowStep step="3" label="Inference" active={state.reconstructionStatus === 'INFERENCE'} complete={['POST-PROCESSING', 'COMPLETE', 'STALE'].includes(state.reconstructionStatus)} />
               <WorkflowStep step="4" label="Done" active={state.reconstructionStatus === 'POST-PROCESSING'} complete={['COMPLETE', 'STALE'].includes(state.reconstructionStatus)} />
            </div>
            
            {state.reconstructionStatus === 'IDLE' && (
              <div style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '1.5rem' }}>
                Waiting for execution.
              </div>
            )}
          </div>

        </div>
      </div>

      {/* =========================================
          ZONE 3: OUTPUT ZONE
          ========================================= */}
      <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
         <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--card-border)', paddingBottom: '0.5rem' }}>
            <MapIcon size={18} color="var(--accent-cyan)" /> 3. Subsurface Reconstruction Output
         </h3>

         <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr', gap: '1.5rem', minHeight: '350px' }}>
            
            {/* Depth Filter */}
            <div style={{ display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--card-border)', paddingRight: '1.5rem' }}>
               <h4 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '1rem' }}>Display Depth</h4>
               <DepthSelector />
               
               <div style={{ marginTop: '2rem' }}>
                 <h4 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '1rem' }}>Metadata</h4>
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.8rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Status:</span>
                      <span style={{ color: isComplete ? '#10B981' : 'var(--text-secondary)' }}>{state.reconstructionStatus}</span>
                    </div>
                    {isComplete && state.reconstructionResult && (
                      <>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--text-secondary)' }}>Model Type:</span>
                          <span style={{ color: 'var(--accent-cyan)' }}>{state.reconstructionResult.metadata.name}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--text-secondary)' }}>Source:</span>
                          <span style={{ color: 'var(--accent-cyan)' }}>{state.reconstructionResult.mode.toUpperCase()}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--text-secondary)' }}>Generated:</span>
                          <span>{new Date(state.reconstructionResult.timestamp).toLocaleTimeString()}</span>
                        </div>
                      </>
                    )}
                 </div>
               </div>
            </div>

            {/* Reconstructed Map */}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.85rem', color: 'white', fontWeight: 500 }}>
                 <span>Depth Slice: {state.selectedDepth}m</span>
                 <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>Target: {state.selectedDate}</span>
               </div>
               <div style={{ flex: 1, borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--card-border)', position: 'relative' }}>
                 <MapComponent 
                   surfaceData={isComplete && state.reconstructionResult && !isStale ? state.reconstructionResult.data[state.selectedDepthIndex] : null} 
                 />
                 {(!isComplete || isStale) && (
                   <div style={{ position: 'absolute', inset: 0, background: 'rgba(15, 23, 42, 0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                     <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                       {isStale ? 'Configuration changed. Run reconstruction to update map.' : 'Run reconstruction to generate 3D field.'}
                     </span>
                   </div>
                 )}
               </div>
            </div>

            {/* Profile & Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
               <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--card-border)', borderRadius: '8px', padding: '1rem' }}>
                 <div style={{ fontSize: '0.85rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                   <BarChart2 size={16} color="var(--accent-cyan)" /> Vertical Profile
                 </div>
                 <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                   Loc: {state.selectedLatitude.toFixed(2)}°N, {state.selectedLongitude.toFixed(2)}°E
                 </div>
                 
                 <div style={{ flex: 1, position: 'relative', minHeight: '150px' }}>
                    {isComplete && !isStale && profileData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={profileData} layout="vertical" margin={{ top: 5, right: 10, left: 0, bottom: 20 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                          <XAxis type="number" domain={['auto', 'auto']} tick={{ fill: '#94a3b8', fontSize: 10 }} stroke="#475569">
                            <Label value="Temp (°C)" offset={-15} position="insideBottom" fill="#94a3b8" fontSize={10}/>
                          </XAxis>
                          <YAxis dataKey="depth" type="number" reversed tick={{ fill: '#94a3b8', fontSize: 10 }} stroke="#475569" width={30} />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc', fontSize: '0.75rem' }}
                            formatter={(val: any) => [`${Number(val).toFixed(2)} °C`]}
                          />
                          <Line name="Model" type="monotone" dataKey="temperature" stroke="#06b6d4" strokeWidth={2} dot={{ r: 2, fill: '#06b6d4' }} activeDot={{ r: 4 }} />
                          <ReferenceLine y={state.selectedDepth} stroke="#3b82f6" strokeOpacity={0.5} strokeWidth={1} />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', fontSize: '0.75rem', textAlign: 'center' }}>
                        Run reconstruction to view profile.
                      </div>
                    )}
                 </div>
               </div>

               <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                 <button
                   disabled={!isComplete || isStale}
                   onClick={() => setPage('Validation')}
                   className={!isComplete || isStale ? "btn-outline" : "btn-primary"}
                   style={{ width: '100%', padding: '10px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                 >
                   <CheckCircle size={16} /> Validate with ARGO
                 </button>
                 <button
                   disabled={!isComplete || isStale}
                   onClick={() => setPage('3DOcean')}
                   className="btn-outline"
                   style={{ width: '100%', padding: '10px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: (!isComplete || isStale) ? 'var(--text-secondary)' : 'var(--accent-cyan)' }}
                 >
                   <Database size={16} /> View in 3D
                 </button>
               </div>
            </div>

         </div>
      </div>
      
    </div>
  );
}
