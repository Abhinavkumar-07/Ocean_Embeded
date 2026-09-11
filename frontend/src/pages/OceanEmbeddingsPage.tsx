import React, { useMemo } from 'react';
import { useOcean } from '../store/OceanContext';
import { generateDemoEmbedding } from '../data/demoData';
import { Layers, Activity, Database, AlertCircle, Info } from 'lucide-react';
import { ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Cell } from 'recharts';

export const OceanEmbeddingsPage: React.FC = () => {
  const { state, setPage } = useOcean();

  const isConfigured = state.reconstructionStatus === 'COMPLETE' && !['STALE', 'IDLE'].includes(state.reconstructionStatus);

  // Generate deterministic embedding
  const embedding = useMemo(() => {
    if (!isConfigured) return null;
    return generateDemoEmbedding(
      state.selectedDate,
      state.selectedRegion,
      state.selectedModel,
      state.temporalWindow,
      state.selectedVariables,
      state.selectedLatitude,
      state.selectedLongitude
    );
  }, [
    isConfigured, state.selectedDate, state.selectedRegion, 
    state.selectedModel, state.temporalWindow, state.selectedVariables, 
    state.selectedLatitude, state.selectedLongitude
  ]);

  // Generate simulated PCA points for the surrounding grid to visualize a latent space
  const pcaData = useMemo(() => {
    if (!isConfigured || !embedding) return [];
    
    const points = [];
    // The "main" point
    points.push({ x: embedding[0] * 10 - 5, y: embedding[1] * 10 - 5, type: 'selected', id: 'Selected Location' });
    
    // Generate 50 context points deterministically shifted from the main embedding
    for (let i = 0; i < 50; i++) {
       // deterministic mock offset based on index and the primary embedding
       const offsetX = Math.sin(i * 0.5 + embedding[2]) * 8;
       const offsetY = Math.cos(i * 0.7 + embedding[3]) * 8;
       
       // Cluster logic (e.g. simulate different ocean "regimes")
       const regime = i % 3 === 0 ? 'Coastal' : i % 3 === 1 ? 'Deep Ocean' : 'Equatorial';
       
       points.push({
         x: (embedding[0] * 10 - 5) + offsetX,
         y: (embedding[1] * 10 - 5) + offsetY,
         type: regime,
         id: `Point ${i}`
       });
    }
    return points;
  }, [isConfigured, embedding]);

  if (!isConfigured) {
    return (
      <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '1rem' }}>
        <Database size={48} color="var(--text-secondary)" />
        <h2 style={{ fontSize: '1.2rem', color: 'var(--text-secondary)' }}>No Reconstruction Result Available</h2>
        <p style={{ color: 'var(--text-secondary)', textAlign: 'center', maxWidth: '400px' }}>
          Run the Temperature Reconstruction pipeline first to generate the deterministic configuration required for embedding projection.
        </p>
        <button className="btn-primary" onClick={() => setPage('Temperature')} style={{ padding: '10px 20px', marginTop: '1rem' }}>
          Go to Reconstruction
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', animation: 'fadeIn 0.3s ease', paddingBottom: '2rem' }}>
      
      {/* HEADER */}
      <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Layers size={20} color="var(--accent-cyan)" /> 
            Model & Embeddings
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
            Visualizing the encoded latent space of the ocean state.
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
           <div style={{ fontSize: '0.65rem', padding: '4px 8px', background: 'rgba(56, 189, 248, 0.1)', color: 'var(--accent-cyan)', border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: '4px', display: 'inline-block', fontWeight: 600 }}>
             OCEAN EMBEDDING PROJECTION
           </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        
        {/* Vector Heatmap */}
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
           <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--card-border)', paddingBottom: '0.5rem' }}>
              <Activity size={18} color="var(--accent-cyan)" /> 
              128D Latent Vector
           </h3>
           <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
             <Info size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
             Deterministic representation generated directly from the current reconstruction configuration (Location, Date, Temporal Window, and Variables).
           </p>

           <div style={{ display: 'grid', gridTemplateColumns: 'repeat(16, 1fr)', gap: '4px', background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--card-border)' }}>
             {embedding?.map((val, i) => {
               // Normalize for color mapping (assuming vals roughly 0 to 2 for this demo)
               const intensity = Math.min(1, Math.max(0, val / 2));
               return (
                 <div 
                   key={i} 
                   title={`Dimension ${i}: ${val.toFixed(3)}`}
                   style={{ 
                     aspectRatio: '1', 
                     background: `rgba(6, 182, 212, ${intensity})`,
                     borderRadius: '2px',
                     border: '1px solid rgba(255,255,255,0.05)',
                     cursor: 'crosshair'
                   }} 
                 />
               );
             })}
           </div>
           
           <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', border: '1px solid var(--card-border)', fontSize: '0.85rem' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Source Vector ID:</span>
                <span>{state.selectedLatitude.toFixed(2)}N_{state.selectedLongitude.toFixed(2)}E_{state.selectedDate.replace(/-/g, '')}</span>
             </div>
             <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Architecture:</span>
                <span style={{ color: 'var(--accent-cyan)' }}>{state.reconstructionResult?.metadata.name}</span>
             </div>
             <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Sparsity:</span>
                <span>{((embedding?.filter(v => v === 0).length || 0) / 128 * 100).toFixed(1)}%</span>
             </div>
           </div>
        </div>

        {/* PCA Projection */}
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
           <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--card-border)', paddingBottom: '0.5rem' }}>
              <Database size={18} color="var(--accent-cyan)" /> 
              Embedding Space — High-dimensional physical projection
           </h3>
           <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
             <AlertCircle size={16} color="#F59E0B" style={{ flexShrink: 0, marginTop: '2px' }} />
             Deterministic representation derived from reference states.
           </p>

           <div style={{ flex: 1, minHeight: '300px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', border: '1px solid var(--card-border)' }}>
             <ResponsiveContainer width="100%" height="100%">
               <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                 <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                 <XAxis type="number" dataKey="x" name="Dim1" tick={false} stroke="#475569" />
                 <YAxis type="number" dataKey="y" name="Dim2" tick={false} stroke="#475569" />
                 <RechartsTooltip 
                   cursor={{ strokeDasharray: '3 3' }} 
                   contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc', fontSize: '0.75rem' }}
                   formatter={(_val: any, _name: any, props: any) => [props.payload.id, props.payload.type]}
                 />
                 <Scatter data={pcaData} fill="#8884d8">
                   {pcaData.map((entry, index) => {
                     let color = '#475569';
                     if (entry.type === 'selected') color = '#38BDF8';
                     else if (entry.type === 'Coastal') color = '#10B981';
                     else if (entry.type === 'Deep Ocean') color = '#3B82F6';
                     else if (entry.type === 'Equatorial') color = '#F59E0B';
                     
                     return <Cell key={`cell-${index}`} fill={color} />;
                   })}
                 </Scatter>
               </ScatterChart>
             </ResponsiveContainer>
           </div>
           
           <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '1rem', fontSize: '0.75rem' }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width: 8, height: 8, borderRadius: '50%', background: '#38BDF8' }} /> Selected</div>
             <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981' }} /> Coastal</div>
             <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width: 8, height: 8, borderRadius: '50%', background: '#3B82F6' }} /> Deep</div>
             <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width: 8, height: 8, borderRadius: '50%', background: '#F59E0B' }} /> Equatorial</div>
           </div>
        </div>

      </div>
    </div>
  );
};
