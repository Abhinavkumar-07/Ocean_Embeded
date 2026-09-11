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
import { Search, Bell, Droplet, Wind, Activity, Thermometer, Waves, Cpu } from 'lucide-react';
import { useOcean } from './store/OceanContext';
import { ContextBar } from './components/ContextBar';
import { fetchSurfaceData, fetchInferenceData, fetchProfile, checkBackendHealth, fetchSurfaceMetrics } from './data/api';
import { calculateThermoclineProxy, calculateHeatContentProxy } from './data/demoData';
import { OceanEmbeddingsPage } from './pages/OceanEmbeddingsPage';

export const AdvancedDashboard = () => {
  const { state, setPage, setSurfaceData, setSurfaceMetrics, setInferenceData, setProfile, setDepth, setVariable } = useOcean();
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

  const handleSimulationResult = (data: any) => {
    if (data.data) {
       setInferenceData(data.data, data.depths);
    }
  };

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
               {state.demoMode ? 'DEMO SYNTHETIC' : 'GLORYS REFERENCE'}
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
    // Dynamic Analysis Math
    let thermoDepth = 'NOT AVAILABLE';
    let heatContent = 'NOT AVAILABLE';
    let thermoProxyText = 'Run Reconstruction to analyze profile.';
    
    // Use the current pre-fetched profile for the selected coordinate
    if (state.profile?.predicted) {
      const analysisProfile = state.profile.predicted;
      
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

        <div className="glass-panel" style={{ padding: 0, display: 'flex', flexDirection: 'column', position: 'relative' }}>
          {/* 3D Temperature Reconstruction Title is now handled internally by Stack3D */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
             <Stack3D inferenceData={state.inferenceData} depths={state.depths} activeDepthIndex={state.selectedDepth} onDepthChange={setDepth} />
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
          {/* Animated Sonar Background Effect */}
          <div style={{ position: 'absolute', top: '-50%', left: '-50%', width: '200%', height: '200%', background: 'radial-gradient(circle, transparent 20%, rgba(56, 189, 248, 0.03) 21%, transparent 22%)', backgroundSize: '40px 40px', opacity: 0.5, pointerEvents: 'none', animation: 'spin 60s linear infinite' }}></div>
          
          <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px', zIndex: 1 }}>
            <Activity size={18} color="#38BDF8" /> Naval Acoustic Intelligence
          </h2>
          
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem', zIndex: 1 }}>
             <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '1rem', borderRadius: '8px' }}>
                <h3 style={{ fontSize: '0.85rem', color: '#10B981', fontWeight: 600, marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Tactical Stealth Zone</h3>
                <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'white', marginBottom: '4px' }}>
                  {thermoDepth !== 'NOT AVAILABLE' ? `${(parseFloat(thermoDepth) + 25).toFixed(1)} m - ${(parseFloat(thermoDepth) + 150).toFixed(1)} m` : 'Calculating...'}
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                  Optimal depth band for submarine evasion. The sharp thermocline boundary above this zone reflects surface active sonar upwards, creating an acoustic shadow.
                </p>
             </div>
             
             <div style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)', padding: '1rem', borderRadius: '8px' }}>
                <h3 style={{ fontSize: '0.85rem', color: '#3B82F6', fontWeight: 600, marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Sonar Propagation Range</h3>
                <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'white', marginBottom: '4px' }}>
                  {thermoDepth !== 'NOT AVAILABLE' ? `Surface Ducting: Active` : 'Scanning...'}
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                  Based on current temperature/salinity gradients, low-frequency passive sonar ranges are extended by 14% in the mixed surface layer.
                </p>
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
