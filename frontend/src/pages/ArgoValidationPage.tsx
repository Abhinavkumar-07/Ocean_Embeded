import { useEffect, useState, useMemo } from 'react';
import { useOcean } from '../store/OceanContext';
import { getValidationResult } from '../data/api';
import { MetricCard } from '../components/MetricCard';
import { Charts } from '../components/Charts';
import { MapComponent } from '../components/MapComponent';
import { Activity, Thermometer, CheckCircle, Target, Crosshair, HelpCircle, FileText } from 'lucide-react';

export const ArgoValidationPage = () => {
  const { state, setValidationResult, setLocation, setProfile } = useOcean();
  const [loading, setLoading] = useState(false);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);

  // When reconstruction changes or on mount, fetch validation
  useEffect(() => {
    if (!state.reconstructionResult) return;
    
    // Only fetch if we don't have it or it's for a different reconstruction
    if (!state.validationResult || 
        state.validationResult.reconstructionDate !== state.reconstructionResult.date ||
        state.validationResult.reconstructionRegion !== state.reconstructionResult.region) {
      
      const fetchValidation = async () => {
        setLoading(true);
        try {
          const res = await getValidationResult(state.reconstructionResult!);
          setValidationResult(res);
          if (res.matchedProfiles.length > 0) {
            setSelectedProfileId(res.matchedProfiles[0].floatId);
          }
        } catch (e) {
          console.error("Failed to load validation:", e);
        } finally {
          setLoading(false);
        }
      };
      
      fetchValidation();
    }
  }, [state.reconstructionResult]);

  // Sync selected profile back to OceanContext for Maps/Charts
  useEffect(() => {
    if (state.validationResult && selectedProfileId) {
      const p = state.validationResult.matchedProfiles.find(x => x.floatId === selectedProfileId);
      if (p) {
        setLocation({ lat: p.lat, lon: p.lon });
        // Set generic profile so existing Charts("profile") can read it
        setProfile({
          lat: p.lat,
          lon: p.lon,
          date: p.date,
          depths: p.depths,
          predicted: p.predictedTemp,
          observed: p.argoTemp,
          soundSpeed: [], // Not used here
          source: 'argo'
        });
      }
    }
  }, [selectedProfileId, state.validationResult]);

  if (!state.reconstructionResult) {
    return (
      <div className="glass-panel" style={{ padding: '4rem', textAlign: 'center', marginTop: '2rem' }}>
        <Target size={48} color="var(--text-secondary)" style={{ margin: '0 auto 1rem auto' }} />
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>NO RECONSTRUCTION AVAILABLE</h2>
        <p style={{ color: 'var(--text-secondary)' }}>
          Run a Temperature Reconstruction before opening ARGO Validation.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="glass-panel" style={{ padding: '4rem', textAlign: 'center', marginTop: '2rem' }}>
        <div className="loading-spinner"></div>
        <p style={{ color: 'var(--text-secondary)', marginTop: '1rem' }}>Matching ARGO profiles...</p>
      </div>
    );
  }

  if (!state.validationResult) {
    return (
      <div className="glass-panel" style={{ padding: '4rem', textAlign: 'center', marginTop: '2rem' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Validation data unavailable.</p>
      </div>
    );
  }

  const { overallMetrics, matchedProfiles, depthMetrics, validationPoints, metadata, bandMetrics } = state.validationResult;

  const handleHighestError = () => {
    let maxRmse = -1;
    let targetId = null;
    matchedProfiles.forEach(p => {
      if (p.rmse > maxRmse) {
        maxRmse = p.rmse;
        targetId = p.floatId;
      }
    });
    if (targetId) setSelectedProfileId(targetId);
  };

  const scatterData = useMemo(() => {
    // Show selected profile or all
    // Let's show the selected profile points to prevent overplotting, or a sample.
    // Let's show all points for global view, it's ~120 points (8 floats * 15 depths)
    return validationPoints.map(p => ({
      observed: p.observedTemperature,
      predicted: p.predictedTemperature,
      depth: p.depth
    }));
  }, [validationPoints]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Title & Metadata Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
         <div>
           <h1 style={{ fontSize: '1.4rem', fontWeight: 600, margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
             <Target size={24} color="var(--accent-cyan)" /> ARGO Validation
           </h1>
           <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.9rem' }}>
             Evaluate reconstructed subsurface temperature against independent vertical observations.
           </p>
         </div>
         {metadata.mode === 'demo' && (
           <div style={{ background: 'rgba(249, 115, 22, 0.15)', border: '1px solid #f97316', color: '#fdba74', padding: '6px 12px', borderRadius: '4px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <HelpCircle size={14} /> DEMO VALIDATION — Synthetic ARGO-like observations. Not independent scientific validation.
           </div>
         )}
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1rem' }}>
        <MetricCard icon={<Crosshair color="#3B82F6" />} title="Profiles Evaluated" value={matchedProfiles.length.toString()} sub={`${state.validationResult.totalProfiles} total in region`} />
        <MetricCard icon={<Thermometer color="#EF4444" />} title="Overall RMSE" value={`${overallMetrics.overallRMSE.toFixed(2)} °C`} sub="Root Mean Square Error" />
        <MetricCard icon={<Thermometer color="#F59E0B" />} title="Overall MAE" value={`${overallMetrics.overallMAE.toFixed(2)} °C`} sub="Mean Absolute Error" />
        <MetricCard icon={<Activity color="#10B981" />} title="Overall Bias" value={`${overallMetrics.overallBias.toFixed(2)} °C`} sub="Mean Error" />
        <MetricCard icon={<CheckCircle color="#8B5CF6" />} title="Correlation (R²)" value={overallMetrics.overallR2.toFixed(2)} sub={`Corr: ${overallMetrics.overallCorrelation.toFixed(2)}`} />
      </div>

      {/* Band Metrics (Phase 6 specific) */}
      <div className="glass-panel" style={{ padding: '1rem', display: 'flex', gap: '2rem', background: 'rgba(255,255,255,0.02)' }}>
         <div>
           <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Upper Ocean (0-50m)</span>
           <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>RMSE {bandMetrics.upperOcean.rmse.toFixed(2)} °C</div>
         </div>
         <div style={{ borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: '2rem' }}>
           <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Transition Region (75-300m)</span>
           <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>RMSE {bandMetrics.transitionRegion.rmse.toFixed(2)} °C</div>
         </div>
         <div style={{ borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: '2rem' }}>
           <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Deep Ocean (500-1000m)</span>
           <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>RMSE {bandMetrics.deepOcean.rmse.toFixed(2)} °C</div>
         </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', minHeight: '400px' }}>
        
        {/* Map */}
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column' }}>
           <div style={{ padding: '1rem', borderBottom: '1px solid var(--card-border)', display: 'flex', justifyContent: 'space-between' }}>
             <h2 style={{ fontSize: '1rem', margin: 0 }}>Validation Spatial Distribution</h2>
             <button className="secondary-btn" onClick={handleHighestError} style={{ padding: '4px 8px', fontSize: '0.75rem' }}>
                Inspect Highest Error
             </button>
           </div>
           <div style={{ flex: 1, position: 'relative' }}>
              <MapComponent 
                 surfaceData={null} 
                 validationMarkers={matchedProfiles.map(p => ({
                   id: p.floatId,
                   lat: p.lat,
                   lon: p.lon,
                   rmse: p.rmse,
                   selected: p.floatId === selectedProfileId
                 }))}
                 onMarkerSelect={(id: string) => setSelectedProfileId(id)}
              />
           </div>
        </div>

        {/* Selected Profile Comparison */}
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', padding: '1rem' }}>
           {selectedProfileId ? (() => {
             const p = matchedProfiles.find(x => x.floatId === selectedProfileId)!;
             return (
               <>
                 <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                   <div>
                     <h2 style={{ fontSize: '1rem', margin: 0 }}>Float {p.floatId}</h2>
                     <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        {p.lat.toFixed(2)}°N, {p.lon.toFixed(2)}°E — {p.date}
                     </div>
                   </div>
                   <div style={{ textAlign: 'right' }}>
                     <div style={{ fontSize: '1rem', color: '#ef4444', fontWeight: 600 }}>RMSE: {p.rmse.toFixed(2)} °C</div>
                     <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>MAE: {p.mae.toFixed(2)} °C</div>
                   </div>
                 </div>
                 <div style={{ flex: 1, minHeight: '300px' }}>
                    <Charts type="profile" data={state.profile} />
                 </div>
               </>
             )
           })() : (
             <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                Select a profile on the map to view comparison.
             </div>
           )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', minHeight: '300px' }}>
        {/* Depth-wise RMSE */}
        <div className="glass-panel" style={{ padding: '1rem' }}>
           <h2 style={{ fontSize: '1rem', margin: '0 0 1rem 0' }}>RMSE by Depth</h2>
           <Charts type="depth_rmse" data={depthMetrics} />
        </div>
        
        {/* Scatter Plot */}
        <div className="glass-panel" style={{ padding: '1rem' }}>
           <h2 style={{ fontSize: '1rem', margin: '0 0 1rem 0' }}>Observed vs Predicted</h2>
           <Charts type="scatter_obs_pred" data={scatterData} />
        </div>
      </div>

      {/* Methodology & Provenance */}
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <h2 style={{ fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
          <FileText size={18} /> Methodology & Provenance
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
          <div>
            <strong style={{ color: 'white' }}>Matching Pipeline</strong>
            <ol style={{ paddingLeft: '1rem', marginTop: '0.5rem' }}>
              <li>Select ARGO profiles within region/date bounds.</li>
              <li>Extract exact coordinate pairs.</li>
              <li>Apply standard-depth interpolation policy (ARGO profiles are interpolated to the 15 standard model depths).</li>
              <li>Compare temperatures using convention: <code>error = predictedTemperature - observedTemperature</code>.</li>
              <li>Calculate numerical metrics strictly from this paired array.</li>
            </ol>
          </div>
          <div>
             <strong style={{ color: 'white' }}>Data Provenance</strong>
             <ul style={{ paddingLeft: '1rem', marginTop: '0.5rem' }}>
               <li><strong>Training/Reference:</strong> {metadata.trainingTarget}</li>
               <li><strong>Independent Validation:</strong> {metadata.validationSource}</li>
               <li><strong>Temporal Window:</strong> {metadata.evaluationPeriod}</li>
             </ul>
             <div style={{ marginTop: '1rem', background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '4px' }}>
               <strong style={{ color: 'white' }}>Scientific Distinction</strong>
               <p style={{ margin: '0.5rem 0 0 0' }}>
                 GLORYS data is used strictly as the target label during model training. ARGO profiles serve as an entirely independent physical observation set reserved exclusively for validation generalization scoring.
               </p>
             </div>
          </div>
        </div>
      </div>

    </div>
  );
};
