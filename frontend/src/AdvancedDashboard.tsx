import { useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { MetricCard } from './components/MetricCard';
import { MapComponent } from './components/MapComponent';
import { Stack3D } from './components/Stack3D';
import { Charts } from './components/Charts';
import SimulationControls from './components/SimulationControls';
import { SatelliteDataPage } from './pages/SatelliteDataPage';
import TemperatureReconstructionPage from './pages/TemperatureReconstructionPage';
import Ocean3DPage from './pages/Ocean3DPage';
import { ArgoValidationPage } from './pages/ArgoValidationPage';
import { Search, Bell, Droplet, Wind, Activity, Thermometer, Waves, Database } from 'lucide-react';
import { useOcean } from './store/OceanContext';
import { ContextBar } from './components/ContextBar';
import { fetchSurfaceData, fetchInferenceData, fetchProfile } from './data/api';
import { calculateThermoclineProxy, calculateHeatContentProxy } from './data/demoData';
import { OceanEmbeddingsPage } from './pages/OceanEmbeddingsPage';

export const AdvancedDashboard = () => {
  const { state, setPage, setSurfaceData, setInferenceData, setProfile, setDepth } = useOcean();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const surfRes = await fetchSurfaceData(state.selectedVariable, state.selectedDate, state.selectedRegion);
        setSurfaceData(surfRes.data);

        const infRes = await fetchInferenceData();
        setInferenceData(infRes.data, infRes.depths);
        
        const profRes = await fetchProfile(state.selectedLatitude, state.selectedLongitude, state.selectedDate);
        setProfile(profRes.profile);
      } catch (err) {
        console.error("Fetch failed", err);
      }
    };
    fetchData();
  }, [state.selectedVariable, state.selectedDate, state.selectedRegion, state.selectedLatitude, state.selectedLongitude]);

  const handleSimulationResult = (data: any) => {
    if (data.data) {
      setInferenceData(data.data, data.depths || state.depths);
    }
  };

  const renderDashboard = () => (
    <>
      {/* Top Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1rem' }}>
        <MetricCard icon={<Thermometer color="#EF4444" />} title="Surface Temperature (SST)" value={state.selectedVariable === 'sst' && state.surfaceData.length > 0 ? 'Map Active' : 'NOT AVAILABLE'} sub="Source: Selected Variable" />
        <MetricCard icon={<Droplet color="#3B82F6" />} title="Sea Surface Salinity (SSS)" value={state.selectedVariable === 'sss' && state.surfaceData.length > 0 ? 'Map Active' : 'NOT AVAILABLE'} sub="Source: Selected Variable" />
        <MetricCard icon={<Activity color="#10B981" />} title="Sea Level Anomaly (SSH)" value={state.selectedVariable === 'ssh' && state.surfaceData.length > 0 ? 'Map Active' : 'NOT AVAILABLE'} sub="Source: Selected Variable" />
        <MetricCard icon={<Wind color="#8B5CF6" />} title="Surface Winds" value={state.selectedVariable === 'wind' && state.surfaceData.length > 0 ? 'Map Active' : 'NOT AVAILABLE'} sub="Source: Selected Variable" />
        <MetricCard icon={<Activity color="#14B8A6" />} title="Surface Currents" value={state.selectedVariable === 'current' && state.surfaceData.length > 0 ? 'Map Active' : 'NOT AVAILABLE'} sub="Source: Selected Variable" />
      </div>

      {/* Main 2-Column Split */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr', gap: '1.5rem', minHeight: '500px' }}>
        <div className="glass-panel" style={{ padding: '1rem', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 600 }}>{state.selectedRegion} - Sea Surface Temperature</h2>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.1)', padding: '4px 8px', borderRadius: '4px' }}>{state.selectedDate}</span>
          </div>
          <div style={{ flex: 1, borderRadius: '8px', overflow: 'hidden', position: 'relative' }}>
            <MapComponent surfaceData={state.surfaceData} />
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1rem', display: 'flex', flexDirection: 'column' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>3D Temperature Reconstruction</h2>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
             <Stack3D inferenceData={state.inferenceData} depths={state.depths} activeDepthIndex={state.selectedDepth} onDepthChange={setDepth} />
          </div>
        </div>
      </div>

      {/* Bottom Row Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem' }}>
        <div className="glass-panel" style={{ padding: '1rem' }}>
           <h2 style={{ fontSize: '0.9rem', marginBottom: '1rem' }}>Vertical Temperature Profile</h2>
           <Charts type="profile" data={state.profile} />
        </div>
        <div className="glass-panel" style={{ padding: '1rem' }}>
           <h2 style={{ fontSize: '0.9rem', marginBottom: '1rem' }}>Model Performance</h2>
           {!state.validationResult ? (
             <div style={{ padding: '1rem', textAlign: 'center', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
               Run ARGO Validation to calculate model performance.
             </div>
           ) : (
             <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <MetricCard small icon={<Thermometer size={16} color="#EF4444" />} title="RMSE" value={`${state.validationResult.overallMetrics.overallRMSE.toFixed(3)} °C`} />
                <MetricCard small icon={<Activity size={16} color="#3B82F6" />} title="MAE" value={`${state.validationResult.overallMetrics.overallMAE.toFixed(3)} °C`} />
                <MetricCard small icon={<Activity size={16} color="#10B981" />} title="R² Score" value={state.validationResult.overallMetrics.overallR2.toFixed(3)} />
                <MetricCard small icon={<Activity size={16} color="#8B5CF6" />} title="Correlation" value={state.validationResult.overallMetrics.overallCorrelation.toFixed(3)} />
             </div>
           )}
        </div>
        <div className="glass-panel" style={{ padding: '1rem' }}>
           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
             <h2 style={{ fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
               <Activity size={16} color="#10B981" /> Naval Acoustic Sonar Profile
             </h2>
             <span style={{ fontSize: '0.7rem', color: 'var(--accent-cyan)', border: '1px solid var(--accent-cyan)', padding: '2px 6px', borderRadius: '4px' }}>Mackenzie Eq</span>
           </div>
           <Charts type="sonar" data={state.profile} />
        </div>
      </div>
    </>
  );

  const renderAnalysisView = () => {
    // Dynamic Analysis Math
    let thermoDepth = 'NOT AVAILABLE';
    let heatContent = 'NOT AVAILABLE';
    let thermoProxyText = 'Run Reconstruction to analyze profile.';
    
    // Find the profile for the selected coordinate from the full reconstruction if available
    if (state.reconstructionResult && state.reconstructionResult.data.length > 0) {
      // Find matrix indices for lat/lon (simplified approximation based on 0.25deg resolution)
      const latIdx = Math.floor((state.selectedLatitude + 90) * 4);
      const lonIdx = Math.floor((state.selectedLongitude + 180) * 4);
      
      const profileAtLoc: number[] = [];
      let valid = true;
      for (const layer of state.reconstructionResult.data) {
        // Bound checks are needed in a real app, here we extract safely
        const val = (layer[latIdx] && layer[latIdx][lonIdx]) ? layer[latIdx][lonIdx] : null;
        if (val === null) { valid = false; break; }
        profileAtLoc.push(val);
      }
      
      // Fallback: If we can't extract the exact indices easily from the sparse 2D arrays, 
      // we can use the deterministic profile generator matching demoData directly just for the metric calculation,
      // OR we just use the selected coordinate's pre-fetched single profile if available
      const analysisProfile = state.profile?.predicted || (valid ? profileAtLoc : null);

      if (analysisProfile) {
         const tProxy = calculateThermoclineProxy(analysisProfile);
         if (tProxy) {
           thermoDepth = `${tProxy.depth.toFixed(1)} m`;
           thermoProxyText = `Maximum vertical temperature gradient: ${tProxy.gradient.toFixed(3)} °C/m`;
         }
         
         const hcProxy = calculateHeatContentProxy(analysisProfile);
         if (hcProxy) {
           heatContent = `${hcProxy.toFixed(1)} Units`;
         }
      }
    }

    return (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr', gap: '1.5rem', minHeight: '600px' }}>
        <div className="glass-panel" style={{ padding: '1rem', display: 'flex', flexDirection: 'column' }}>
          <SimulationControls onSimulationResult={handleSimulationResult} />
          <div style={{ marginTop: '2rem' }}>
             <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
               Analysis Metrics
             </h2>
             <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
                <div title="Depth of maximum vertical temperature gradient in the reconstructed profile.">
                  <MetricCard small icon={<Thermometer size={16} color="#EF4444" />} title="Maximum Gradient Depth" value={thermoDepth} sub={thermoProxyText} />
                </div>
                <div title="Mathematical proxy for relative heat content based on profile integration.">
                  <MetricCard small icon={<Activity size={16} color="#3B82F6" />} title="Thermal Content Proxy" value={heatContent} sub="Calculated from reconstruction" />
                </div>
             </div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1rem', display: 'flex', flexDirection: 'column' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            3D Temperature Reconstruction 
            {state.reconstructionResult?.mode === 'demo' && (
               <span style={{ fontSize: '0.65rem', padding: '2px 6px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '4px' }}>PRECOMPUTED DEMO</span>
            )}
          </h2>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
             <Stack3D inferenceData={state.inferenceData} depths={state.depths} activeDepthIndex={state.selectedDepth} onDepthChange={setDepth} />
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1rem', display: 'flex', flexDirection: 'column' }}>
          {/* XAI Map Removed per Instructions */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', textAlign: 'center', gap: '1rem' }}>
             <Database size={48} color="var(--text-secondary)" />
             <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Explainability / XAI</h3>
             <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px' }}>
                <p style={{ color: '#F59E0B', marginBottom: '8px' }}>Unavailable — requires trained model inference.</p>
                <p>Model attribution (e.g. Integrated Gradients, SHAP) will be available after the trained PyTorch model is connected to the backend.</p>
             </div>
             
             <div style={{ marginTop: '2rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                <strong>Uncertainty Estimation:</strong>
                <p>Not available in current demo.</p>
             </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-color)', color: 'var(--text-primary)' }}>
      <Sidebar activePage={state.activePage} setActivePage={setPage} />
      
      <div style={{ flex: 1, padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', overflowY: 'auto', height: '100vh' }}>
        
        {/* Header */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '40px', height: '40px', background: 'var(--accent-blue)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Waves color="white" />
              </div>
              <div>
                <h1 style={{ fontSize: '1.4rem', fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  Ocean<span style={{ color: 'var(--accent-cyan)' }}>Embed</span>
                </h1>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 }}>From Space to the Deep</p>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', margin: 0 }}>AI for a Deeper, Healthier Ocean</p>
              </div>
            </div>
            
            {/* Top Navigation Pill */}
            <div style={{ display: 'flex', background: 'rgba(255,255,255,0.03)', borderRadius: '30px', padding: '4px', border: '1px solid var(--card-border)' }}>
               {['Home', 'Explore', 'Model', 'Validation', 'Insights', 'About'].map((item) => {
                  const mapping: any = { 'Home': 'Dashboard', 'Insights': 'Analysis', 'Validation': 'Validation', 'Model': 'Model' };
                  const isActive = state.activePage === item || (item==='Home' && state.activePage==='Dashboard') || (item==='Insights' && state.activePage==='Analysis') || (item==='Validation' && state.activePage==='Validation') || (item==='Model' && state.activePage==='Model');
                  return (
                    <div key={item} 
                         onClick={() => {
                             if (mapping[item]) setPage(mapping[item]);
                         }}
                         style={{ padding: '6px 16px', fontSize: '0.85rem', borderRadius: '20px', 
                                  background: isActive ? 'rgba(56, 189, 248, 0.15)' : 'transparent', 
                                  color: isActive ? 'var(--accent-cyan)' : 'var(--text-secondary)', 
                                  cursor: 'pointer' }}>
                      {item}
                    </div>
                  );
               })}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--card-border)', padding: '8px 16px', borderRadius: '20px' }}>
              <Search size={16} color="var(--text-secondary)" style={{ marginRight: '8px' }} />
              <input type="text" placeholder="Search location..." style={{ background: 'transparent', border: 'none', color: 'white', outline: 'none', fontSize: '0.85rem' }} />
            </div>
            <Bell size={18} color="var(--text-secondary)" />
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--accent-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', fontWeight: 600 }}>A</div>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Aarav ▼</span>
            </div>
          </div>
        </header>

        <ContextBar />

        {/* Dynamic Content Based on Active Page */}
        {state.activePage === 'Dashboard' && renderDashboard()}
        {state.activePage === 'Analysis' && renderAnalysisView()}
        {state.activePage === 'Validation' && <ArgoValidationPage />}
        {state.activePage === 'Satellite' && <SatelliteDataPage />}
        {state.activePage === 'Temperature' && <TemperatureReconstructionPage />}
        {state.activePage === '3DOcean' && <Ocean3DPage />}
        {state.activePage === 'Model' && <OceanEmbeddingsPage />}
        
        {/* Fallback for un-implemented pages */}
        {['Download', 'Documentation'].includes(state.activePage) && (
            <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', marginTop: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--text-secondary)' }}>{state.activePage} Module</h2>
                <p style={{ color: 'var(--text-secondary)' }}>This module is currently under development.</p>
            </div>
        )}

      </div>
    </div>
  );
};
