import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { MetricCard } from './components/MetricCard';
import { MapComponent } from './components/MapComponent';
import { Stack3D } from './components/Stack3D';
import { Charts } from './components/Charts';
import { Search, Bell, Droplet, Wind, Activity, Thermometer, Waves } from 'lucide-react';

const API_URL = 'http://localhost:8000/api/v1';

export const AdvancedDashboard = () => {
  const [surfaceData, setSurfaceData] = useState<(number | null)[][]>([]);
  const [inferenceData, setInferenceData] = useState<(number | null)[][][]>([]);
  const [depths, setDepths] = useState<number[]>([]);
  const [selectedDepth, setSelectedDepth] = useState(0);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const surfRes = await fetch(`${API_URL}/data/surface`);
        const surfJson = await surfRes.json();
        if (surfJson.data) setSurfaceData(surfJson.data);

        const infRes = await fetch(`${API_URL}/inference`);
        const infJson = await infRes.json();
        if (infJson.data) {
          setInferenceData(infJson.data);
          setDepths(infJson.depths);
        }
        
        const profRes = await fetch(`${API_URL}/profile?lat=15.6&lon=88.4`);
        const profJson = await profRes.json();
        setProfile(profJson);
      } catch (err) {
        console.error("Fetch failed", err);
      }
    };
    fetchData();
  }, []);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-color)', color: 'var(--text-primary)' }}>
      <Sidebar />
      
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
               {['Home', 'Explore', 'Model', 'Validation', 'Insights', 'About'].map((item, i) => (
                 <div key={item} style={{ padding: '6px 16px', fontSize: '0.85rem', borderRadius: '20px', background: i === 0 ? 'rgba(56, 189, 248, 0.15)' : 'transparent', color: i === 0 ? 'var(--accent-cyan)' : 'var(--text-secondary)', cursor: 'pointer' }}>
                   {item}
                 </div>
               ))}
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

        {/* Top Metrics Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1rem' }}>
          <MetricCard icon={<Thermometer color="#EF4444" />} title="Surface Temperature (SST)" value="28.4 °C" sub="Live Satellite Data" />
          <MetricCard icon={<Droplet color="#3B82F6" />} title="Sea Surface Salinity (SSS)" value="34.9 PSU" sub="Live Satellite Data" />
          <MetricCard icon={<Activity color="#10B981" />} title="Sea Level Anomaly (SSH)" value="0.12 m" sub="Live Satellite Data" />
          <MetricCard icon={<Wind color="#8B5CF6" />} title="Surface Winds" value="6.2 m/s" sub="Live Satellite Data" />
          <MetricCard icon={<Activity color="#14B8A6" />} title="Surface Currents" value="0.8 m/s" sub="Live Satellite Data" />
        </div>

        {/* Main 2-Column Split */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr', gap: '1.5rem', minHeight: '500px' }}>
          
          <div className="glass-panel" style={{ padding: '1rem', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 600 }}>North Indian Ocean - Sea Surface Temperature</h2>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.1)', padding: '4px 8px', borderRadius: '4px' }}>15 Aug 2025</span>
            </div>
            <div style={{ flex: 1, borderRadius: '8px', overflow: 'hidden', position: 'relative' }}>
              <MapComponent surfaceData={surfaceData} />
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '1rem', display: 'flex', flexDirection: 'column' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>3D Temperature Reconstruction</h2>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
               <Stack3D inferenceData={inferenceData} depths={depths} activeDepthIndex={selectedDepth} onDepthChange={setSelectedDepth} />
            </div>
          </div>

        </div>

        {/* Bottom Row Charts */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem' }}>
          <div className="glass-panel" style={{ padding: '1rem' }}>
             <h2 style={{ fontSize: '0.9rem', marginBottom: '1rem' }}>Vertical Temperature Profile</h2>
             <Charts type="profile" data={profile} />
          </div>
          <div className="glass-panel" style={{ padding: '1rem' }}>
             <h2 style={{ fontSize: '0.9rem', marginBottom: '1rem' }}>Model Performance</h2>
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
                 <Activity size={16} color="#10B981" /> Naval Acoustic Sonar Profile
               </h2>
               <span style={{ fontSize: '0.7rem', color: 'var(--accent-cyan)', border: '1px solid var(--accent-cyan)', padding: '2px 6px', borderRadius: '4px' }}>Mackenzie Eq</span>
             </div>
             <Charts type="sonar" data={profile} />
          </div>
        </div>

      </div>
    </div>
  );
};
