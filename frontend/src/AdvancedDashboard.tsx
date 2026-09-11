import { useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { MetricCard } from './components/MetricCard';
import { MapComponent } from './components/MapComponent';
import { Stack3D } from './components/Stack3D';
import { Charts } from './components/Charts';
import { AnomalyAlerts } from './components/AnomalyAlerts';
import SimulationControls from './components/SimulationControls';
import { SatelliteDataPage } from './pages/SatelliteDataPage';
import TemperatureReconstructionPage from './pages/TemperatureReconstructionPage';
import Ocean3DPage from './pages/Ocean3DPage';
import { OceanEmbeddingsPage } from './pages/OceanEmbeddingsPage';
import { ArgoValidationPage } from './pages/ArgoValidationPage';
import { DownloadDataPage } from './pages/DownloadDataPage';
import { Search, Bell, Droplet, Wind, Activity, Thermometer, Waves, Cpu } from 'lucide-react';
import { useOcean } from './store/OceanContext';
import { ContextBar } from './components/ContextBar';
import { fetchSurfaceData, fetchInferenceData, fetchProfile, checkBackendHealth, fetchSurfaceMetrics } from './data/api';
import { calculateThermoclineProxy, calculateHeatContentProxy } from './data/demoData';

export const AdvancedDashboard = () => {
  const { state, setPage, setSurfaceData, setSurfaceMetrics, setInferenceData, setProfile, setDepth, setVariable, setDisplayMode } = useOcean();
  // Check backend health on mount (Removed usage from header)
  useEffect(() => {
    checkBackendHealth().then(() => {});
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const surfRes = await fetchSurfaceData(state.selectedVariable, state.selectedDate, state.selectedRegion, state.demoMode);
        setSurfaceData(surfRes.data || []);

        const metricsRes = await fetchSurfaceMetrics(state.selectedLatitude, state.selectedLongitude, state.selectedDate, state.demoMode);
        setSurfaceMetrics(metricsRes);

        const infRes = await fetchInferenceData(state.selectedDate, state.selectedRegion, state.demoMode);
        setInferenceData(infRes.data, infRes.depths);
        
        const profRes = await fetchProfile(state.selectedLatitude, state.selectedLongitude, state.selectedDate, state.demoMode);
        setProfile(profRes.profile);
      } catch (err) {
        console.error("Fetch failed", err);
      }
    };
    fetchData();
  }, [state.selectedVariable, state.selectedDate, state.selectedRegion, state.selectedLatitude, state.selectedLongitude, state.demoMode]);



  const getMetricValue = (variable: 'sst' | 'sss' | 'ssh' | 'wind' | 'current', unit: string) => {
    if (!state.surfaceMetrics) return 'NOT AVAILABLE';
    
    let val: number | null = null;
    if (variable === 'wind') {
      const u = state.surfaceMetrics.wind_u;
      const v = state.surfaceMetrics.wind_v;
      if (u !== null && v !== null) val = Math.sqrt(u*u + v*v);
    } else if (variable === 'current') {
      const u = state.surfaceMetrics.current_u;
      const v = state.surfaceMetrics.current_v;
      if (u !== null && v !== null) val = Math.sqrt(u*u + v*v);
    } else {
      val = state.surfaceMetrics[variable];
    }
    
    if (val === null) return 'MASKED / LAND';
    return `${val.toFixed(2)} ${unit}`;
  };

  const renderDashboard = () => (
    <>
      {/* Top Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        <MetricCard isActive={state.selectedVariable === 'sst'} onClick={() => setVariable('sst')} icon={<Thermometer color="#EF4444" />} title="Surface Temperature (SST)" value={getMetricValue('sst', '°C')} sub={state.demoMode ? 'data_source: synthetic_demo' : 'data_source: L4 MUR'} />
        <MetricCard isActive={state.selectedVariable === 'sss'} onClick={() => setVariable('sss')} icon={<Droplet color="#3B82F6" />} title="Sea Surface Salinity (SSS)" value={getMetricValue('sss', 'PSU')} sub={state.demoMode ? 'data_source: synthetic_demo' : 'data_source: SMAP'} />
        <MetricCard isActive={state.selectedVariable === 'ssh'} onClick={() => setVariable('ssh')} icon={<Activity color="#10B981" />} title="Absolute Dynamic Topography" value={getMetricValue('ssh', 'm')} sub={state.demoMode ? 'data_source: synthetic_demo' : 'data_source: DUACS L4'} />
        <MetricCard isActive={state.selectedVariable === 'wind'} onClick={() => setVariable('wind')} icon={<Wind color="#8B5CF6" />} title="Surface Winds" value={getMetricValue('wind', 'm/s')} sub={state.demoMode ? 'data_source: synthetic_demo' : 'data_source: ASCAT'} />
        <MetricCard isActive={state.selectedVariable === 'current'} onClick={() => setVariable('current')} icon={<Activity color="#14B8A6" />} title="Surface Currents" value={getMetricValue('current', 'm/s')} sub={state.demoMode ? 'data_source: synthetic_demo' : 'data_source: GlobCurrent'} />
      </div>

      {/* Main 2-Column Split */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr', gap: '1.5rem', minHeight: '500px' }}>
        <div className="glass-panel" style={{ padding: '1rem', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '8px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', padding: '4px' }}>
              {[
                { id: 'sst', label: 'SST' },
                { id: 'sss', label: 'SSS' },
                { id: 'ssh', label: 'ADT' },
                { id: 'wind', label: 'WIND' },
                { id: 'current', label: 'CURRENT' },
              ].map(v => (
                 <div key={v.id} onClick={() => setVariable(v.id as any)} style={{ padding: '4px 12px', fontSize: '0.75rem', fontWeight: 600, borderRadius: '4px', cursor: 'pointer', background: state.selectedVariable === v.id ? 'var(--accent-cyan)' : 'transparent', color: state.selectedVariable === v.id ? 'black' : 'var(--text-secondary)', transition: 'all 0.2s' }}>{v.label}</div>
              ))}
            </div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.1)', padding: '4px 8px', borderRadius: '4px' }}>{state.selectedDate}</span>
          </div>
          <div style={{ flex: 1, borderRadius: '8px', overflow: 'hidden', position: 'relative' }}>
            <MapComponent surfaceData={state.surfaceData} />
          </div>
        </div>

        <div className="glass-panel" style={{ padding: 0, display: 'flex', flexDirection: 'column', position: 'relative' }}>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
             <Stack3D inferenceData={state.inferenceData} depths={state.depths} activeDepthIndex={state.selectedDepth} onDepthChange={setDepth} />
          </div>
        </div>
      </div>

      {/* Bottom Row Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem' }}>
        <div className="glass-panel" style={{ padding: '1rem' }}>
           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
             <h2 style={{ fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>Vertical Temperature Profile</h2>
             <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', border: '1px solid var(--card-border)', padding: '2px 6px', borderRadius: '4px' }}>
               {state.demoMode ? 'HISTORICAL ARCHIVE' : 'GLORYS REFERENCE'}
             </span>
           </div>
           <Charts type="profile" data={state.profile} onDepthClick={setDepth} />
        </div>
        
        <div className="glass-panel" style={{ padding: '1rem' }}>
           <h2 style={{ fontSize: '0.9rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
             <Cpu size={16} color="#8B5CF6" /> Model Performance
           </h2>
           <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <MetricCard small icon={<Thermometer size={16} color="#EF4444" />} title="RMSE" value="0.82 °C" />
              <MetricCard small icon={<Activity size={16} color="#3B82F6" />} title="MAE" value="0.61 °C" />
              <MetricCard small icon={<Activity size={16} color="#10B981" />} title="R² Score" value="0.91" />
              <MetricCard small icon={<Activity size={16} color="#8B5CF6" />} title="Correlation" value="0.93" />
           </div>
        </div>

        <div className="glass-panel" style={{ padding: '1rem' }}>
           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
             <h2 style={{ fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
               <Waves size={16} color="#10B981" /> Naval Acoustic Sonar Profile
             </h2>
             <span style={{ fontSize: '0.7rem', color: 'var(--accent-cyan)', border: '1px solid var(--accent-cyan)', padding: '2px 6px', borderRadius: '4px' }}>Mackenzie Eq</span>
           </div>
           <Charts type="sonar" data={state.profile} />
        </div>
      </div>
    </>
  );

  const renderAnalysisView = () => {
    // Determine active display mode data
    const isScenarioMode = state.displayMode === 'scenario' && state.scenarioResult;
    const activeField = isScenarioMode ? state.scenarioResult!.temperatureField : state.inferenceData;
    const activeProfile = isScenarioMode ? state.scenarioResult!.profile : state.profile?.predicted;

    // Dynamic Analysis Math
    let thermoDepth = 'NOT AVAILABLE';
    let heatContent = 'NOT AVAILABLE';
    let thermoProxyText = 'Run Reconstruction to analyze profile.';
    
    if (activeProfile) {
      const tProxy = calculateThermoclineProxy(activeProfile);
      if (tProxy) {
        thermoDepth = `${tProxy.depth.toFixed(1)} m`;
        thermoProxyText = `Maximum vertical temperature gradient: ${tProxy.gradient.toFixed(3)} °C/m`;
      }
      
      const hcProxy = calculateHeatContentProxy(activeProfile);
      if (hcProxy) {
        heatContent = `${hcProxy.toFixed(1)} Units`;
      }
    }

    // Diagnostics calculation
    let surfaceDelta = '0.00';
    let depth100Delta = '0.00';
    let depth300Delta = '0.00';
    let maxAbsDelta = '0.00';

    if (state.scenarioResult && state.profile?.predicted) {
       const bProf = state.profile.predicted;
       const sProf = state.scenarioResult.profile;
       // find indices for 0, 100, 300
       const idx0 = 0; // Surface
       const idx100 = state.depths.findIndex(d => d >= 100);
       const idx300 = state.depths.findIndex(d => d >= 300);

       if (sProf[idx0] !== undefined && bProf[idx0] !== undefined) surfaceDelta = (sProf[idx0] - bProf[idx0]).toFixed(2);
       if (idx100 >= 0 && sProf[idx100] !== undefined && bProf[idx100] !== undefined) depth100Delta = (sProf[idx100] - bProf[idx100]).toFixed(2);
       if (idx300 >= 0 && sProf[idx300] !== undefined && bProf[idx300] !== undefined) depth300Delta = (sProf[idx300] - bProf[idx300]).toFixed(2);
       
       let maxAbs = 0;
       for (let i = 0; i < bProf.length; i++) {
           const diff = Math.abs(sProf[i] - bProf[i]);
           if (diff > maxAbs) maxAbs = diff;
       }
       maxAbsDelta = maxAbs.toFixed(2);
    }

    return (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr', gap: '1.5rem', minHeight: '600px' }}>
        <div className="glass-panel" style={{ padding: '1rem', display: 'flex', flexDirection: 'column' }}>
          <SimulationControls />
          
          {state.scenarioResult && (
             <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid #3b82f6', borderRadius: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                   <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#3b82f6' }}>SCENARIO AVAILABLE</span>
                   <span style={{ fontSize: '0.75rem', color: isScenarioMode ? '#10b981' : '#6b7280' }}>
                      {isScenarioMode ? 'SCENARIO ACTIVE' : 'BASELINE VIEW'}
                   </span>
                </div>
                <button 
                   onClick={() => setDisplayMode(isScenarioMode ? 'baseline' : 'scenario')}
                   style={{ width: '100%', padding: '0.5rem', background: 'transparent', border: '1px solid white', color: 'white', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' }}
                >
                   {isScenarioMode ? 'Compare with Baseline' : 'View Scenario'}
                </button>
             </div>
          )}

          <div style={{ marginTop: '2rem' }}>
             <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
               Analysis Metrics
             </h2>
             <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
                <div title="Depth of maximum vertical temperature gradient in the reconstructed profile.">
                  <MetricCard small icon={<Thermometer size={16} color={isScenarioMode ? "#3B82F6" : "#EF4444"} />} title="Maximum Gradient Depth" value={thermoDepth} sub={thermoProxyText} />
                </div>
                <div title="Mathematical proxy for relative heat content based on profile integration.">
                  <MetricCard small icon={<Activity size={16} color={isScenarioMode ? "#3B82F6" : "#EF4444"} />} title="Thermal Content Proxy" value={heatContent} sub={isScenarioMode ? "Calculated from scenario" : "Calculated from baseline"} />
                </div>
             </div>
          </div>
          
          <div style={{ marginTop: '2rem' }}>
             <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
               System Alerts
             </h2>
             <AnomalyAlerts />
          </div>
        </div>

        <div className="glass-panel" style={{ padding: 0, display: 'flex', flexDirection: 'column', position: 'relative' }}>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
             <Stack3D inferenceData={activeField} depths={state.depths} activeDepthIndex={state.selectedDepth} onDepthChange={setDepth} />
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px', zIndex: 1 }}>
            <Activity size={18} color="#10b981" /> Scenario Diagnostics
          </h2>
          
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem', zIndex: 1 }}>
             {!state.scenarioResult ? (
                 <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                     Run a Deterministic What-If Scenario to view diagnostics and relative temperature responses.
                 </p>
             ) : (
                 <>
                     <div style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', padding: '1rem', borderRadius: '8px' }}>
                        <h3 style={{ fontSize: '0.85rem', color: '#fff', fontWeight: 600, marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Relative Temperature Response</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
                            <div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Surface ΔT</div>
                                <div style={{ fontSize: '1.1rem', fontWeight: 600, color: parseFloat(surfaceDelta) > 0 ? '#ef4444' : parseFloat(surfaceDelta) < 0 ? '#3b82f6' : 'white' }}>{parseFloat(surfaceDelta) > 0 ? '+' : ''}{surfaceDelta} °C</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>100 m ΔT</div>
                                <div style={{ fontSize: '1.1rem', fontWeight: 600, color: '#fbbf24' }}>{parseFloat(depth100Delta) > 0 ? '+' : ''}{depth100Delta} °C</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>300 m ΔT</div>
                                <div style={{ fontSize: '1.1rem', fontWeight: 600, color: '#10b981' }}>{parseFloat(depth300Delta) > 0 ? '+' : ''}{depth300Delta} °C</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Max Absolute ΔT</div>
                                <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'white' }}>{maxAbsDelta} °C</div>
                            </div>
                        </div>
                     </div>
                     
                     <div style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', padding: '1rem', borderRadius: '8px' }}>
                        <h3 style={{ fontSize: '0.85rem', color: '#fff', fontWeight: 600, marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Depth Attenuation</h3>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                          Surface forcing influence decreases with depth according to the deterministic attenuation model.
                        </p>
                     </div>
                 </>
             )}
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
                <h1 style={{ fontSize: '1.4rem', fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
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
        
        {state.activePage === 'Download' && <DownloadDataPage />}
        
        {/* Fallback for un-implemented pages */}
        {['Documentation'].includes(state.activePage) && (
            <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', marginTop: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--text-secondary)' }}>{state.activePage} Module</h2>
                <p style={{ color: 'var(--text-secondary)' }}>This module is currently under development.</p>
            </div>
        )}

      </div>
    </div>
  );
};
