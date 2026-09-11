import React, { useState } from 'react';
import { Download, Database, Code, CheckCircle, ArrowRight, FileJson, Cpu } from 'lucide-react';
import { useOcean } from '../store/OceanContext';

export const DownloadDataPage: React.FC = () => {
  const { state } = useOcean();
  const [downloading, setDownloading] = useState<string | null>(null);

  const triggerDownload = (filename: string, content: string, type: string = 'text/csv') => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadCSV = () => {
    setDownloading('csv');
    setTimeout(() => {
      const csvContent = `Latitude,Longitude,Date,Depth,Temperature,Salinity\n${state.selectedLatitude},${state.selectedLongitude},${state.selectedDate},0m,28.4,34.2\n${state.selectedLatitude},${state.selectedLongitude},${state.selectedDate},50m,26.1,34.5\n${state.selectedLatitude},${state.selectedLongitude},${state.selectedDate},100m,22.3,34.8\n`;
      triggerDownload(`ocean_profile_${state.selectedRegion}_${state.selectedDate}.csv`, csvContent);
      setDownloading(null);
    }, 800);
  };

  const handleDownloadWeights = () => {
    setDownloading('weights');
    setTimeout(() => {
      triggerDownload('oceanembed_v1.2_weights.pt', 'mock_binary_data_for_oceanembed_model_weights', 'application/octet-stream');
      setDownloading(null);
    }, 1200);
  };

  const handleDownloadArchive = () => {
    setDownloading('archive');
    setTimeout(() => {
      triggerDownload('historical_benchmark_dataset.zip', 'mock_zip_archive_content', 'application/zip');
      setDownloading(null);
    }, 1500);
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', color: 'white' }}>
      <div style={{ marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Download size={32} color="var(--accent-cyan)" />
          Data & Model Export
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', maxWidth: '800px' }}>
          Export 3D ocean reconstructions, download pre-trained OceanEmbed model weights, or access historical benchmark datasets for offline analysis.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
        
        {/* Model Weights */}
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1rem' }}>
            <div style={{ background: 'rgba(56, 189, 248, 0.1)', padding: '12px', borderRadius: '12px' }}>
              <Cpu size={28} color="var(--accent-cyan)" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 600 }}>Model Checkpoints</h3>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>PyTorch (.pt) Weights</span>
            </div>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', flex: 1, lineHeight: 1.5 }}>
            Download the pre-trained OceanEmbed foundation model weights. This allows for local deployment and offline inference without relying on cloud computation.
          </p>
          <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--card-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Size: ~245 MB</span>
            <button 
              onClick={handleDownloadWeights}
              disabled={downloading === 'weights'}
              style={{ 
                background: downloading === 'weights' ? '#10b981' : 'var(--accent-cyan)', 
                color: '#060B11', border: 'none', padding: '8px 16px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s' 
              }}>
              {downloading === 'weights' ? <><CheckCircle size={16} /> Packaging...</> : <><Download size={16} /> Download .pt</>}
            </button>
          </div>
        </div>

        {/* Current Reconstructed Profile */}
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1rem' }}>
            <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '12px', borderRadius: '12px' }}>
              <FileJson size={28} color="#10b981" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 600 }}>Active Reconstruction</h3>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>CSV / NetCDF Export</span>
            </div>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', flex: 1, lineHeight: 1.5 }}>
            Export the currently active 3D profile reconstruction for {state.selectedRegion}. Contains high-resolution depth profiles of Temperature and Salinity.
          </p>
          <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--card-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Dynamic Size</span>
            <button 
              onClick={handleDownloadCSV}
              disabled={downloading === 'csv'}
              style={{ 
                background: downloading === 'csv' ? '#10b981' : 'transparent', 
                color: downloading === 'csv' ? '#060B11' : 'white', border: '1px solid #10b981', padding: '8px 16px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s' 
              }}>
              {downloading === 'csv' ? <><CheckCircle size={16} /> Exporting...</> : <><Download size={16} color="#10b981" /> Export as CSV</>}
            </button>
          </div>
        </div>

        {/* Benchmark Datasets */}
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1rem' }}>
            <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '12px', borderRadius: '12px' }}>
              <Database size={28} color="#F59E0B" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 600 }}>Historical Benchmark</h3>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Training & Validation Data</span>
            </div>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', flex: 1, lineHeight: 1.5 }}>
            Download the raw historical baseline datasets used for training and validation, including cross-referenced ARGO float observations and NASA Satellite streams.
          </p>
          <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--card-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Size: 1.2 GB</span>
            <button 
              onClick={handleDownloadArchive}
              disabled={downloading === 'archive'}
              style={{ 
                background: downloading === 'archive' ? '#10b981' : 'transparent', 
                color: downloading === 'archive' ? '#060B11' : 'white', border: '1px solid #F59E0B', padding: '8px 16px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s' 
              }}>
              {downloading === 'archive' ? <><CheckCircle size={16} /> Compressing...</> : <><Download size={16} color="#F59E0B" /> Download ZIP</>}
            </button>
          </div>
        </div>

      </div>

      {/* API Reference Banner */}
      <div className="glass-panel" style={{ marginTop: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.5rem 2rem', background: 'linear-gradient(to right, rgba(14, 23, 34, 0.9), rgba(56, 189, 248, 0.1))' }}>
        <div>
          <h3 style={{ fontSize: '1.2rem', margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Code size={20} color="var(--accent-cyan)" /> Automated API Access
          </h3>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Need to script your downloads? You can fetch all models and datasets programmatically via the OceanEmbed REST API.
          </p>
        </div>
        <button style={{ background: 'transparent', color: 'var(--accent-cyan)', border: '1px solid var(--accent-cyan)', padding: '10px 20px', borderRadius: '6px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
          View API Docs <ArrowRight size={16} />
        </button>
      </div>

    </div>
  );
};
