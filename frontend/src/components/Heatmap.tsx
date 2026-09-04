import React, { useEffect, useRef } from 'react';

interface HeatmapProps {
  data: (number | null)[][];
  min: number;
  max: number;
  width?: number;
  height?: number;
  colorScale?: 'turbo' | 'viridis' | 'ocean';
}

// Very simple linear interpolation for a deep ocean color scale
const getColor = (value: number, min: number, max: number, scale: string) => {
  if (value === null || isNaN(value)) return 'transparent';
  
  const norm = Math.max(0, Math.min(1, (value - min) / (max - min)));
  
  if (scale === 'ocean') {
    // Deep blue (0) to Cyan (0.5) to Yellow/White (1)
    if (norm < 0.5) {
      const r = 0;
      const g = Math.floor((norm * 2) * 202); // 0 to 202
      const b = Math.floor(100 + (norm * 2) * 128); // 100 to 228
      return `rgb(${r}, ${g}, ${b})`;
    } else {
      const n2 = (norm - 0.5) * 2;
      const r = Math.floor(n2 * 255);
      const g = Math.floor(202 + n2 * 53);
      const b = Math.floor(228 + n2 * 27);
      return `rgb(${r}, ${g}, ${b})`;
    }
  }
  
  // Fallback simple red-blue scale
  const hue = (1 - norm) * 240;
  return `hsl(${hue}, 100%, 50%)`;
};

export const Heatmap: React.FC<HeatmapProps & { hideLegend?: boolean }> = ({ 
  data, 
  min, 
  max, 
  width = 400, 
  height = 400,
  colorScale = 'ocean',
  hideLegend = false,
  style
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !data || data.length === 0) return;
    
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    const rows = data.length;
    const cols = data[0].length;
    
    const cellW = width / cols;
    const cellH = height / rows;

    ctx.clearRect(0, 0, width, height);

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const val = data[r][c];
        ctx.fillStyle = getColor(val, min, max, colorScale);
        if (ctx.fillStyle !== 'transparent') {
          ctx.fillRect(c * cellW, r * cellH, cellW + 0.5, cellH + 0.5); // +0.5 to prevent sub-pixel gaps
        }
      }
    }
  }, [data, min, max, width, height, colorScale]);

  if (!data || data.length === 0) {
    return (
      <div 
        style={{ width, height, display: 'flex', alignItems: 'center', justifyContent: 'center' }} 
        className="glass-panel"
      >
        <span style={{ color: 'var(--text-secondary)' }}>No Data</span>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
      <canvas 
        ref={canvasRef} 
        width={width} 
        height={height} 
        style={{ 
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
          background: 'rgba(0,0,0,0.2)',
          ...style
        }}
      />
      
      {/* Legend */}
      {!hideLegend && (
        <div style={{ display: 'flex', width: '100%', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-secondary)' }}>
          <span>{min.toFixed(1)}°C</span>
          <div style={{ 
            flex: 1, 
            height: '8px', 
            background: 'linear-gradient(to right, rgb(0,0,100), rgb(0,202,228), rgb(255,255,255))',
            borderRadius: '4px'
          }} />
          <span>{max.toFixed(1)}°C</span>
        </div>
      )}
    </div>
  );
};
