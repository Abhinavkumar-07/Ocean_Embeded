import { useState } from 'react';
import { Heatmap } from './Heatmap';

export const Stack3D = ({ inferenceData, depths, activeDepthIndex, onDepthChange }: any) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (!inferenceData || inferenceData.length === 0) return <div>No data</div>;

  const displayIndices = [0, 2, 5, 8, 11, 14]; 
  
  return (
    <div style={{ position: 'relative', display: 'flex', width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent' }}>
      
      {/* Top Left Titles */}
      <div style={{ position: 'absolute', top: '10px', left: '20px', zIndex: 20 }}>
        <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600, color: '#ffffff' }}>Temperature Reconstruction</h2>
        <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#94a3b8' }}>Explore ocean temperature at different depths</p>
      </div>

      {/* Legend on the right */}
      <div style={{ position: 'absolute', top: '20px', right: '30px', zIndex: 20, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <span style={{ fontSize: '0.75rem', color: '#cbd5e1', marginBottom: '8px' }}>Temperature (°C)</span>
        <div style={{ display: 'flex' }}>
          <div style={{ 
            width: '12px', 
            height: '160px', 
            background: 'linear-gradient(to bottom, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff)',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: '2px'
          }}></div>
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', marginLeft: '8px', height: '160px', fontSize: '0.7rem', color: '#94a3b8' }}>
            <span>32</span>
            <span>28</span>
            <span>24</span>
            <span>20</span>
            <span>16</span>
            <span>12</span>
            <span>8</span>
            <span>4</span>
            <span>0</span>
          </div>
        </div>
      </div>

      {/* 3D Stack Container (Isometric Orthographic Projection) */}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', marginTop: '160px' }}>
        <div style={{ 
          position: 'relative', 
          width: '360px', 
          height: '240px',
          transformStyle: 'preserve-3d',
          transform: 'rotateX(60deg) rotateZ(-45deg)'
        }}>
          {displayIndices.map((layerIndex, stackIdx) => {
            const data = inferenceData[layerIndex];
            if (!data) return null;
            
            const depthValue = depths[layerIndex];
            const isActive = activeDepthIndex === depthValue;
            const isHovered = hoveredIndex === depthValue;
            
            // Base Z offset + pop out effect on hover/active
            const baseZOffset = (displayIndices.length - 1 - stackIdx) * 45;
            const popOffset = isActive ? 12 : (isHovered ? 6 : 0);
            const zOffset = baseZOffset + popOffset;

            return (
              <div 
                key={layerIndex} 
                onMouseEnter={() => setHoveredIndex(depthValue)}
                onMouseLeave={() => setHoveredIndex(null)}
                style={{
                  position: 'absolute',
                  top: 0, left: 0,
                  width: '100%', height: '100%',
                  transform: `translateZ(${zOffset}px)`,
                  transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                  transformStyle: 'preserve-3d',
                  cursor: 'pointer'
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  onDepthChange(depthValue);
                }}
              >
                {/* Embedded 3D perfectly-aligned label */}
                <div 
                  style={{
                    position: 'absolute',
                    left: '-20px',
                    top: '-80px', // Exact coordinate to cancel 3D Y-shift (x_rel = y_rel = -200)
                    // Inverse transform cancels the parent rotation exactly.
                    transform: 'rotateZ(45deg) rotateX(-60deg) translateX(-20px)', 
                    transformOrigin: 'center center',
                    display: 'flex',
                    alignItems: 'center',
                    zIndex: 10,
                  }}
                >
                  <span style={{ 
                    fontSize: isActive ? '1rem' : '0.9rem', 
                    fontWeight: isActive ? 600 : 400, 
                    color: isActive ? '#fff' : '#94a3b8', 
                    whiteSpace: 'nowrap', 
                    marginRight: '12px',
                    width: '45px', // Fixed width for alignment
                    textAlign: 'right',
                    textShadow: isActive ? '0 0 10px rgba(255,255,255,0.5)' : 'none',
                    transition: 'all 0.3s ease'
                  }}>
                    {depthValue} m
                  </span>
                  
                  {/* Scientific Node */}
                  <div style={{
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {/* Connecting line to the main layer */}
                    <div style={{
                      position: 'absolute',
                      left: '12px',
                      width: '40px',
                      height: '1px',
                      background: isActive ? '#38BDF8' : 'rgba(255,255,255,0.2)',
                      transition: 'all 0.3s ease'
                    }}></div>
                    
                    {/* The Node (Hollow Diamond) */}
                    <div style={{ 
                      width: isActive ? '14px' : '10px', 
                      height: isActive ? '14px' : '10px', 
                      borderRadius: '0%', // Square node for scientific look
                      transform: 'rotate(45deg)', // Diamond
                      background: isActive ? 'rgba(56, 189, 248, 0.2)' : 'transparent',
                      border: `2px solid ${isActive ? '#38BDF8' : 'rgba(255,255,255,0.5)'}`,
                      boxShadow: isActive ? '0 0 10px rgba(56, 189, 248, 0.8), inset 0 0 5px rgba(56, 189, 248, 0.8)' : 'none',
                      transition: 'all 0.3s ease',
                      zIndex: 2
                    }}></div>
                  </div>
                </div>

                {/* Heatmap Layer - Scientific aesthetic */}
                <div style={{ 
                  width: '100%', 
                  height: '100%', 
                  opacity: isActive || isHovered ? 1 : 0.85,
                  border: isActive ? '1.5px solid #38BDF8' : '1px solid rgba(255, 255, 255, 0.2)',
                  boxShadow: isActive ? '0 0 20px rgba(56, 189, 248, 0.4)' : 'none',
                  background: 'rgba(11, 17, 33, 0.8)', // Dark blue background similar to the image
                  borderRadius: '0px', // Sharp corners for data layers
                  overflow: 'hidden',
                  transition: 'all 0.4s ease',
                  position: 'relative' // Needed for the grid overlay
                }}>
                   <Heatmap data={data} min={0} max={32} width={360} height={240} colorScale="turbo" hideLegend={true} />
                   
                   {/* Grid Overlay */}
                   <div style={{
                     position: 'absolute',
                     top: 0, left: 0, right: 0, bottom: 0,
                     backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.15) 1px, transparent 1px)`,
                     backgroundSize: '36px 36px', // Grid squares
                     pointerEvents: 'none' // Click through to heatmap/layer
                   }}></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
